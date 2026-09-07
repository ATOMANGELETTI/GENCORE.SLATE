//! The broker server.

use std::collections::HashSet;
use std::sync::Arc;

use camino::Utf8PathBuf;
use parking_lot::Mutex;
use slate_core::{AppId, PROTOCOL_VERSION};
use slate_ipc::protocol::{Event, Request, Response, RunningApp};
use slate_ipc::{MAX_FRAME_BYTES, broker_pipe_name};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::windows::named_pipe::{NamedPipeServer, ServerOptions};
use tokio::sync::broadcast;

use crate::error::BrokerError;

/// How many events may queue for a slow client before it starts losing them.
///
/// A client that falls this far behind is not going to catch up, and blocking
/// the whole broker to wait for it would let one stuck window freeze the
/// suite. Dropping and logging is the right trade.
const EVENT_BUFFER: usize = 256;

/// One published event, addressed to a topic.
#[derive(Debug, Clone)]
struct Broadcast {
    topic: String,
    event: Event,
    /// The publisher, so it does not receive its own event back.
    origin: Option<AppId>,
}

/// The applications currently connected.
type Registry = Arc<Mutex<Vec<RunningApp>>>;

/// A running broker.
///
/// Dropping this does not stop the broker — it runs on its own thread for the
/// lifetime of the Launcher process, which is exactly as long as it should.
#[derive(Debug, Clone)]
pub struct BrokerHandle {
    address: String,
    registry: Registry,
    events: broadcast::Sender<Broadcast>,
}

impl BrokerHandle {
    /// The named pipe this broker listens on.
    pub fn address(&self) -> &str {
        &self.address
    }

    /// The applications currently connected.
    pub fn connected_apps(&self) -> Vec<RunningApp> {
        self.registry.lock().clone()
    }

    /// Publishes an event from the host application itself.
    ///
    /// The Launcher uses this to announce configuration changes without having
    /// to connect to its own broker as a client.
    pub fn publish(&self, topic: impl Into<String>, event: Event) {
        // A send failure means no subscribers, which is not an error.
        let _ = self.events.send(Broadcast {
            topic: topic.into(),
            event,
            origin: None,
        });
    }
}

/// Starts the broker for `root` on a dedicated thread.
///
/// The Launcher hosts the broker rather than it being a fourth executable —
/// see ADR 0003. The thread runs its own single-threaded Tokio runtime, so the
/// host application does not need to be async anywhere else.
///
/// # Errors
///
/// Returns [`BrokerError::AlreadyRunning`] if another broker already owns the
/// pipe for this portable root — which means a second Launcher was started
/// from the same install, and the correct response is to hand over to the
/// existing one rather than compete with it.
pub fn spawn(root: &camino::Utf8Path) -> Result<BrokerHandle, BrokerError> {
    let address = broker_pipe_name(root);
    let registry: Registry = Arc::new(Mutex::new(Vec::new()));
    let (events, _) = broadcast::channel(EVENT_BUFFER);

    // Create the first server instance on this thread so that "the pipe is
    // taken" is reported to the caller instead of disappearing into a
    // background thread's log.
    let listener = create_pipe(&address, true)?;

    let handle = BrokerHandle {
        address: address.clone(),
        registry: Arc::clone(&registry),
        events: events.clone(),
    };

    let root = Utf8PathBuf::from(root);

    std::thread::Builder::new()
        .name("slate-broker".to_owned())
        .spawn(move || {
            let runtime = match tokio::runtime::Builder::new_current_thread()
                .enable_io()
                .build()
            {
                Ok(runtime) => runtime,
                Err(error) => {
                    tracing::error!(%error, "the broker runtime could not be started");
                    return;
                }
            };

            tracing::info!(%address, root = %root, "broker listening");
            runtime.block_on(accept_loop(address, listener, registry, events));
        })
        .map_err(|error| BrokerError::Thread(error.to_string()))?;

    Ok(handle)
}

/// Accepts connections forever, handing each to its own task.
async fn accept_loop(
    address: String,
    mut listener: NamedPipeServer,
    registry: Registry,
    events: broadcast::Sender<Broadcast>,
) {
    loop {
        if let Err(error) = listener.connect().await {
            tracing::error!(%error, "the broker stopped accepting connections");
            return;
        }

        // Windows named pipes hand the listening instance to the client, so a
        // fresh instance must exist before this one is served or the next
        // client finds nothing listening.
        let next = match create_pipe(&address, false) {
            Ok(pipe) => pipe,
            Err(error) => {
                tracing::error!(%error, "could not create the next pipe instance");
                return;
            }
        };

        let connection = std::mem::replace(&mut listener, next);
        let registry = Arc::clone(&registry);
        let events = events.clone();

        tokio::spawn(async move {
            if let Err(error) = serve(connection, registry, events).await {
                tracing::debug!(%error, "broker connection ended");
            }
        });
    }
}

/// Serves one connection until the client disconnects.
async fn serve(
    mut pipe: NamedPipeServer,
    registry: Registry,
    events: broadcast::Sender<Broadcast>,
) -> Result<(), BrokerError> {
    let mut subscriptions: HashSet<String> = HashSet::new();
    let mut receiver = events.subscribe();
    let mut identity: Option<AppId> = None;

    loop {
        tokio::select! {
            incoming = read_frame(&mut pipe) => {
                let Some(request) = incoming? else {
                    break;
                };

                let response =
                    handle(request, &mut identity, &mut subscriptions, &registry, &events);
                write_frame(&mut pipe, &response).await?;
            }

            broadcast = receiver.recv() => {
                match broadcast {
                    Ok(message) => {
                        let is_own = message.origin.as_ref() == identity.as_ref();
                        if subscriptions.contains(&message.topic) && !is_own {
                            let event = Response::Event { topic: message.topic, event: message.event };
                            write_frame(&mut pipe, &event).await?;
                        }
                    }
                    Err(broadcast::error::RecvError::Lagged(missed)) => {
                        tracing::warn!(app = ?identity, missed, "client fell behind and lost events");
                    }
                    Err(broadcast::error::RecvError::Closed) => break,
                }
            }
        }
    }

    if let Some(app) = identity {
        registry.lock().retain(|entry| entry.app != app);
        let _ = events.send(Broadcast {
            topic: slate_ipc::topics::LIFECYCLE.to_owned(),
            event: Event::AppStopped { app },
            origin: None,
        });
    }

    Ok(())
}

/// Applies one request, returning the response to send back.
fn handle(
    request: Request,
    identity: &mut Option<AppId>,
    subscriptions: &mut HashSet<String>,
    registry: &Registry,
    events: &broadcast::Sender<Broadcast>,
) -> Response {
    match request {
        Request::Hello { app, pid, protocol } => {
            if protocol != PROTOCOL_VERSION {
                // Refusing is deliberate. A client that speaks a different
                // protocol must disable cross-application features rather than
                // guess at message shapes.
                return Response::Error {
                    kind: "protocolMismatch".to_owned(),
                    message: format!(
                        "this broker speaks protocol {PROTOCOL_VERSION}, not {protocol}"
                    ),
                };
            }

            registry.lock().push(RunningApp {
                app: app.clone(),
                pid,
            });
            let _ = events.send(Broadcast {
                topic: slate_ipc::topics::LIFECYCLE.to_owned(),
                event: Event::AppStarted { app: app.clone() },
                origin: Some(app.clone()),
            });
            *identity = Some(app);

            Response::Welcome {
                protocol: PROTOCOL_VERSION,
                suite_version: slate_core::version::SUITE_VERSION.to_owned(),
            }
        }

        Request::Subscribe { topic } => {
            subscriptions.insert(topic);
            Response::Ok
        }

        Request::Unsubscribe { topic } => {
            subscriptions.remove(&topic);
            Response::Ok
        }

        Request::Publish { topic, event } => {
            if identity.is_none() {
                // Publishing before identifying would let an unknown peer
                // broadcast to every window in the suite.
                return Response::Error {
                    kind: "notIdentified".to_owned(),
                    message: "send Hello before publishing".to_owned(),
                };
            }

            let _ = events.send(Broadcast {
                topic,
                event,
                origin: identity.clone(),
            });
            Response::Ok
        }

        Request::ListApps => Response::Apps {
            apps: registry.lock().clone(),
        },

        Request::Ping => Response::Ok,
    }
}

/// Creates one instance of the named pipe.
fn create_pipe(address: &str, first: bool) -> Result<NamedPipeServer, BrokerError> {
    ServerOptions::new()
        .first_pipe_instance(first)
        .create(address)
        .map_err(|error| {
            if first && error.kind() == std::io::ErrorKind::PermissionDenied {
                BrokerError::AlreadyRunning {
                    address: address.to_owned(),
                }
            } else {
                BrokerError::Listen {
                    address: address.to_owned(),
                    reason: error.to_string(),
                }
            }
        })
}

/// Reads one length-prefixed frame, or `None` when the client disconnects.
async fn read_frame(pipe: &mut NamedPipeServer) -> Result<Option<Request>, BrokerError> {
    let mut length_bytes = [0_u8; 4];
    match pipe.read_exact(&mut length_bytes).await {
        Ok(_) => {}
        Err(error) if error.kind() == std::io::ErrorKind::UnexpectedEof => return Ok(None),
        Err(error) if error.kind() == std::io::ErrorKind::BrokenPipe => return Ok(None),
        Err(error) => return Err(BrokerError::Transport(error.to_string())),
    }

    let length = u32::from_le_bytes(length_bytes) as usize;
    if length > MAX_FRAME_BYTES {
        // Refuse before allocating: a hostile prefix must not be able to make
        // the broker reserve what it claims.
        return Err(BrokerError::Transport(format!(
            "frame of {length} bytes exceeds the {MAX_FRAME_BYTES} byte limit"
        )));
    }

    let mut payload = vec![0_u8; length];
    pipe.read_exact(&mut payload)
        .await
        .map_err(|error| BrokerError::Transport(error.to_string()))?;

    serde_json::from_slice(&payload)
        .map(Some)
        .map_err(|error| BrokerError::Transport(format!("undecodable frame: {error}")))
}

/// Writes one length-prefixed frame.
async fn write_frame(pipe: &mut NamedPipeServer, response: &Response) -> Result<(), BrokerError> {
    let payload =
        serde_json::to_vec(response).map_err(|error| BrokerError::Transport(error.to_string()))?;

    let length = u32::try_from(payload.len())
        .map_err(|_| BrokerError::Transport("response is too large to frame".to_owned()))?;

    pipe.write_all(&length.to_le_bytes())
        .await
        .map_err(|error| BrokerError::Transport(error.to_string()))?;
    pipe.write_all(&payload)
        .await
        .map_err(|error| BrokerError::Transport(error.to_string()))?;
    pipe.flush()
        .await
        .map_err(|error| BrokerError::Transport(error.to_string()))?;

    Ok(())
}
