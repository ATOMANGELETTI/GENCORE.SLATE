//! Runtime failures.

use slate_config::ConfigError;
use slate_core::SlateError;
use slate_paths::PathsError;

/// Something went wrong starting or driving the application shell.
#[derive(Debug, thiserror::Error)]
pub enum RuntimeError {
    /// The portable root could not be found or repaired.
    #[error(transparent)]
    Paths(#[from] PathsError),

    /// Configuration could not be loaded or saved.
    #[error(transparent)]
    Config(#[from] ConfigError),

    /// Logging could not be started.
    #[error("could not start logging: {0}")]
    Logging(String),

    /// A window operation failed.
    #[error("window operation failed: {0}")]
    Window(String),
}

impl From<RuntimeError> for SlateError {
    fn from(error: RuntimeError) -> Self {
        match error {
            RuntimeError::Paths(inner) => Self::from(inner),
            RuntimeError::Config(inner) => Self::from(inner),
            other => Self::Internal(other.to_string()),
        }
    }
}
