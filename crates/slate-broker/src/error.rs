//! Broker failures.

use slate_core::SlateError;

/// Something went wrong hosting the broker.
#[derive(Debug, thiserror::Error)]
pub enum BrokerError {
    /// Another broker already owns the pipe for this portable root.
    ///
    /// Means a second Launcher was started from the same install. The correct
    /// response is to hand over to the running one, not to compete with it.
    #[error("a broker is already running at {address}")]
    AlreadyRunning {
        /// The pipe that is taken.
        address: String,
    },

    /// The pipe could not be created.
    #[error("could not listen at {address}: {reason}")]
    Listen {
        /// The pipe that failed.
        address: String,
        /// The underlying failure.
        reason: String,
    },

    /// The broker thread could not be started.
    #[error("could not start the broker thread: {0}")]
    Thread(String),

    /// A connection failed.
    #[error("broker transport failure: {0}")]
    Transport(String),
}

impl BrokerError {
    /// Whether this means another Launcher already owns the session.
    pub fn is_already_running(&self) -> bool {
        matches!(self, Self::AlreadyRunning { .. })
    }
}

impl From<BrokerError> for SlateError {
    fn from(error: BrokerError) -> Self {
        Self::Ipc(error.to_string())
    }
}
