//! IPC failures.

use slate_core::SlateError;

/// Something went wrong talking to the broker.
///
/// Every variant is non-fatal by design. Cross-application features are a
/// convenience layered on top of applications that must work alone, so the
/// correct response to any of these is to log once, disable those features,
/// and carry on — never to block startup or show an error the user cannot act
/// on. See ADR 0003.
#[derive(Debug, thiserror::Error)]
pub enum IpcError {
    /// No broker is listening.
    ///
    /// The ordinary case when an application is started directly rather than
    /// from the Launcher.
    #[error("no broker is listening at {address}")]
    NotListening {
        /// The pipe that was tried.
        address: String,
    },

    /// The connection closed.
    #[error("the broker connection closed")]
    Disconnected,

    /// The broker speaks a protocol this build does not understand.
    ///
    /// The client disconnects rather than guessing at message shapes.
    #[error("broker protocol {theirs} is not compatible with {ours}")]
    ProtocolMismatch {
        /// The version the broker offered.
        theirs: u16,
        /// The version this build speaks.
        ours: u16,
    },

    /// A frame exceeded the size limit.
    ///
    /// Raised before allocating, so a corrupt or hostile length prefix cannot
    /// exhaust memory.
    #[error("frame of {size} bytes exceeds the {limit} byte limit")]
    FrameTooLarge {
        /// The size the prefix claimed.
        size: usize,
        /// The configured limit.
        limit: usize,
    },

    /// A message could not be serialised.
    #[error("could not encode message: {0}")]
    Encode(String),

    /// A message could not be deserialised.
    #[error("could not decode message: {0}")]
    Decode(String),

    /// The underlying transport failed.
    #[error("transport failure: {0}")]
    Transport(String),

    /// The broker rejected the request.
    #[error("broker rejected the request ({kind}): {message}")]
    Rejected {
        /// The failure identifier the broker returned.
        kind: String,
        /// The description it returned.
        message: String,
    },

    /// The broker answered something other than what the request expected.
    #[error("unexpected response to {expected}")]
    UnexpectedResponse {
        /// What the caller was waiting for.
        expected: &'static str,
    },
}

impl IpcError {
    /// Whether this means the broker is simply absent.
    ///
    /// Callers use it to distinguish "running standalone", which is normal and
    /// deserves a single informational log line, from a real fault.
    pub fn is_broker_absent(&self) -> bool {
        matches!(self, Self::NotListening { .. } | Self::Disconnected)
    }
}

impl From<IpcError> for SlateError {
    fn from(error: IpcError) -> Self {
        Self::Ipc(error.to_string())
    }
}
