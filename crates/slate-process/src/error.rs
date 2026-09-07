//! Process failures.

use slate_core::SlateError;

/// Something went wrong starting or tracking a child application.
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum ProcessError {
    /// The executable is not where the portable layout says it should be.
    ///
    /// Common with a partially extracted install, so the message names the
    /// path rather than merely saying the launch failed.
    #[error("no executable at {path}")]
    NotFound {
        /// Where it was expected.
        path: String,
    },

    /// The application is already running.
    #[error("{app} is already running")]
    AlreadyRunning {
        /// The application.
        app: String,
    },

    /// Windows refused to start the process.
    #[error("could not start {app}: {reason}")]
    Spawn {
        /// The application.
        app: String,
        /// The underlying failure.
        reason: String,
    },
}

impl From<ProcessError> for SlateError {
    fn from(error: ProcessError) -> Self {
        match error {
            ProcessError::NotFound { .. } => Self::NotFound(error.to_string()),
            other => Self::Process(other.to_string()),
        }
    }
}
