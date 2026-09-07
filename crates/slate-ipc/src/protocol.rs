//! The broker wire protocol.
//!
//! Message shapes are part of the cross-application contract. Renaming a
//! variant or changing a field is a breaking change: bump
//! [`slate_core::PROTOCOL_VERSION`] and record it in a changeset as a major.

use serde::{Deserialize, Serialize};
use slate_core::AppId;

/// A message sent from an application to the broker.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum Request {
    /// Opens the connection and declares who is speaking.
    ///
    /// Always the first message. The broker answers with
    /// [`Response::Welcome`] carrying the protocol version it speaks.
    #[serde(rename_all = "camelCase")]
    Hello {
        /// The connecting application.
        app: AppId,
        /// Its process id, so the broker can notice when it disappears.
        pid: u32,
        /// The protocol version the client speaks.
        protocol: u16,
    },

    /// Broadcasts an event to every subscriber of `topic`.
    #[serde(rename_all = "camelCase")]
    Publish {
        /// The topic to publish on.
        topic: String,
        /// The event payload.
        event: Event,
    },

    /// Registers interest in a topic.
    #[serde(rename_all = "camelCase")]
    Subscribe {
        /// The topic to receive events for.
        topic: String,
    },

    /// Withdraws interest in a topic.
    #[serde(rename_all = "camelCase")]
    Unsubscribe {
        /// The topic to stop receiving events for.
        topic: String,
    },

    /// Asks which applications are currently connected.
    ListApps,

    /// Keeps an idle connection alive and confirms the broker is responsive.
    Ping,
}

/// A message sent from the broker to an application.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum Response {
    /// The handshake succeeded.
    #[serde(rename_all = "camelCase")]
    Welcome {
        /// The protocol version the broker speaks.
        protocol: u16,
        /// The suite version the broker belongs to.
        suite_version: String,
    },

    /// The request was accepted and produced no data.
    Ok,

    /// The applications currently connected.
    #[serde(rename_all = "camelCase")]
    Apps {
        /// One entry per live connection.
        apps: Vec<RunningApp>,
    },

    /// An event delivered because of an earlier [`Request::Subscribe`].
    ///
    /// Events arrive interleaved with responses, so a client that issues
    /// requests and subscribes on the same connection must be prepared to read
    /// one while waiting for the other.
    #[serde(rename_all = "camelCase")]
    Event {
        /// The topic it was published on.
        topic: String,
        /// The payload.
        event: Event,
    },

    /// The request failed.
    #[serde(rename_all = "camelCase")]
    Error {
        /// A stable identifier for the failure.
        kind: String,
        /// A human-readable description.
        message: String,
    },
}

/// An application connected to the broker.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RunningApp {
    /// Which application it is.
    pub app: AppId,
    /// Its process id.
    pub pid: u32,
}

/// Something worth telling the other applications about.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum Event {
    /// An application connected.
    #[serde(rename_all = "camelCase")]
    AppStarted {
        /// The application that started.
        app: AppId,
    },

    /// An application disconnected.
    #[serde(rename_all = "camelCase")]
    AppStopped {
        /// The application that stopped.
        app: AppId,
    },

    /// Configuration changed and should be reloaded.
    #[serde(rename_all = "camelCase")]
    ConfigChanged {
        /// Which file changed: `suite`, or an application id.
        section: String,
    },

    /// A request to open a path in whichever application handles it.
    ///
    /// Explorer publishes this to ask Terminal to open at a directory.
    #[serde(rename_all = "camelCase")]
    OpenPath {
        /// The application asked to handle it.
        target: AppId,
        /// The path, always inside the portable root.
        path: String,
    },
}

/// Topics the suite publishes on.
///
/// Free-form topics are permitted, but anything two applications rely on
/// belongs here so it can be found and versioned.
pub mod topics {
    /// Application lifecycle: started and stopped.
    pub const LIFECYCLE: &str = "slate/lifecycle";
    /// Configuration reload notifications.
    pub const CONFIG: &str = "slate/config";
    /// Cross-application open requests.
    pub const NAVIGATION: &str = "slate/navigation";
}
