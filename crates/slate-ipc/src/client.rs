//! The blocking broker client used by every application.

use std::collections::VecDeque;
use std::fs::{File, OpenOptions};
use std::io::{BufReader, BufWriter};
use std::sync::mpsc::{self, Receiver};

use camino::Utf8Path;
use slate_core::{AppId, PROTOCOL_VERSION};

use crate::address::broker_pipe_name;
use crate::error::IpcError;
use crate::frame::{read_frame, write_frame};
use crate::protocol::{Event, Request, Response, RunningApp};

/// A connection to the broker.
///
/// Blocking by design: the traffic is a handful of small messages, and a
/// synchronous client keeps applications free of an async runtime they would
/// otherwise carry for nothing.
///
/// Events and responses share the connection, so [`BrokerClient::request`]
/// buffers any event that arrives while it is waiting rather than discarding
/// it. Drain them with [`BrokerClient::take_events`], or hand the connection
/// to a reader thread with [`BrokerClient::into_event_stream`].
#[derive(Debug)]
pub struct BrokerClient {
    reader: BufReader<File>,
    writer: BufWriter<File>,
    app: AppId,
    broker_protocol: u16,
    pending_events: VecDeque<(String, Event)>,
}

impl BrokerClient {
    /// Connects to the broker serving `root` and completes the handshake.
    ///
    /// # Errors
    ///
    /// Returns [`IpcError::NotListening`] when no broker is running — the
    /// normal case for an application started outside the Launcher — or
    /// [`IpcError::ProtocolMismatch`] when the broker speaks a version this
    /// build does not understand.
    pub fn connect(root: &Utf8Path, app: AppId) -> Result<Self, IpcError> {
        let address = broker_pipe_name(root);

        let pipe = OpenOptions::new()
            .read(true)
            .write(true)
            .open(&address)
            .map_err(|_| IpcError::NotListening {
                address: address.clone(),
            })?;

        let write_handle = pipe
            .try_clone()
            .map_err(|error| IpcError::Transport(error.to_string()))?;

        let mut client = Self {
            reader: BufReader::new(pipe),
            writer: BufWriter::new(write_handle),
            app: app.clone(),
            broker_protocol: 0,
            pending_events: VecDeque::new(),
        };

        let hello = Request::Hello {
            app,
            pid: std::process::id(),
            protocol: PROTOCOL_VERSION,
        };

        match client.request(&hello)? {
            Response::Welcome { protocol, .. } => {
                if protocol != PROTOCOL_VERSION {
                    return Err(IpcError::ProtocolMismatch {
                        theirs: protocol,
                        ours: PROTOCOL_VERSION,
                    });
                }
                client.broker_protocol = protocol;
                Ok(client)
            }
            Response::Error { kind, message } => Err(IpcError::Rejected { kind, message }),
            _ => Err(IpcError::UnexpectedResponse {
                expected: "Welcome",
            }),
        }
    }

    /// Connects, or returns `None` if the broker is simply not running.
    ///
    /// This is what applications call at startup. A missing broker means
    /// cross-application features are unavailable, which is a degraded mode
    /// rather than a failure — never block startup on it.
    pub fn try_connect(root: &Utf8Path, app: AppId) -> Option<Self> {
        match Self::connect(root, app) {
            Ok(client) => Some(client),
            Err(error) if error.is_broker_absent() => {
                tracing::info!(%error, "no broker available; cross-application features are disabled");
                None
            }
            Err(error) => {
                tracing::warn!(%error, "could not connect to the broker");
                None
            }
        }
    }

    /// The application this connection belongs to.
    pub fn app(&self) -> &AppId {
        &self.app
    }

    /// The protocol version the broker reported.
    pub fn broker_protocol(&self) -> u16 {
        self.broker_protocol
    }

    /// Sends a request and waits for its response.
    ///
    /// Events arriving while waiting are buffered, not dropped.
    ///
    /// # Errors
    ///
    /// Returns [`IpcError::Disconnected`] if the broker closed the connection,
    /// or a transport or decoding failure.
    pub fn request(&mut self, request: &Request) -> Result<Response, IpcError> {
        write_frame(&mut self.writer, request)?;

        loop {
            match read_frame::<_, Response>(&mut self.reader)? {
                Response::Event { topic, event } => self.pending_events.push_back((topic, event)),
                response => return Ok(response),
            }
        }
    }

    /// Registers interest in a topic.
    ///
    /// # Errors
    ///
    /// As [`BrokerClient::request`], plus [`IpcError::Rejected`] if the broker
    /// refuses the topic.
    pub fn subscribe(&mut self, topic: impl Into<String>) -> Result<(), IpcError> {
        self.expect_ok(&Request::Subscribe {
            topic: topic.into(),
        })
    }

    /// Publishes an event to a topic's subscribers.
    ///
    /// # Errors
    ///
    /// As [`BrokerClient::subscribe`].
    pub fn publish(&mut self, topic: impl Into<String>, event: Event) -> Result<(), IpcError> {
        self.expect_ok(&Request::Publish {
            topic: topic.into(),
            event,
        })
    }

    /// Asks which applications are currently connected.
    ///
    /// # Errors
    ///
    /// As [`BrokerClient::request`].
    pub fn list_apps(&mut self) -> Result<Vec<RunningApp>, IpcError> {
        match self.request(&Request::ListApps)? {
            Response::Apps { apps } => Ok(apps),
            Response::Error { kind, message } => Err(IpcError::Rejected { kind, message }),
            _ => Err(IpcError::UnexpectedResponse { expected: "Apps" }),
        }
    }

    /// Takes the events buffered while waiting for responses.
    pub fn take_events(&mut self) -> Vec<(String, Event)> {
        self.pending_events.drain(..).collect()
    }

    /// Consumes the client and delivers events on a channel.
    ///
    /// Spawns a reader thread that runs until the broker disconnects. Use this
    /// once subscriptions are set up and the application only needs to receive.
    ///
    /// # Errors
    ///
    /// Returns [`IpcError::Transport`] if the reader thread cannot be started.
    pub fn into_event_stream(self) -> Result<Receiver<(String, Event)>, IpcError> {
        let (sender, receiver) = mpsc::channel();

        for buffered in self.pending_events {
            // The receiver is still alive here, so this cannot fail.
            let _ = sender.send(buffered);
        }

        let mut reader = self.reader;
        std::thread::Builder::new()
            .name(format!("slate-ipc-{}", self.app))
            .spawn(move || {
                while let Ok(Response::Event { topic, event }) =
                    read_frame::<_, Response>(&mut reader)
                {
                    if sender.send((topic, event)).is_err() {
                        // The application dropped the receiver; stop reading.
                        break;
                    }
                }
                tracing::debug!("broker event stream ended");
            })
            .map_err(|error| IpcError::Transport(error.to_string()))?;

        Ok(receiver)
    }

    /// Sends a request that is expected to be acknowledged with `Ok`.
    fn expect_ok(&mut self, request: &Request) -> Result<(), IpcError> {
        match self.request(request)? {
            Response::Ok => Ok(()),
            Response::Error { kind, message } => Err(IpcError::Rejected { kind, message }),
            _ => Err(IpcError::UnexpectedResponse { expected: "Ok" }),
        }
    }
}
