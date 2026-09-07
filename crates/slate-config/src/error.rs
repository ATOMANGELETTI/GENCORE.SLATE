//! Configuration failures.

use camino::Utf8PathBuf;
use slate_core::SlateError;
use slate_paths::PathsError;

/// Something went wrong loading or saving configuration.
#[derive(Debug, thiserror::Error)]
pub enum ConfigError {
    /// A configuration file exists but is not valid TOML, or does not match
    /// the schema.
    ///
    /// Deliberately fatal. A silently ignored typo leaves the user changing a
    /// setting that never takes effect, with nothing to explain why.
    #[error("{path} could not be parsed: {reason}")]
    Malformed {
        /// The file that failed.
        path: Utf8PathBuf,
        /// The parse failure, including the line where possible.
        reason: String,
    },

    /// A configuration file could not be read.
    #[error("{path} could not be read: {reason}")]
    Unreadable {
        /// The file that failed.
        path: Utf8PathBuf,
        /// The underlying failure.
        reason: String,
    },

    /// A configuration file could not be written.
    #[error("{path} could not be written: {reason}")]
    Unwritable {
        /// The file that failed.
        path: Utf8PathBuf,
        /// The underlying failure.
        reason: String,
    },

    /// A value was outside the range the schema allows.
    #[error("{field} is invalid: {reason}")]
    Invalid {
        /// The offending field, in dotted form.
        field: String,
        /// Why it was rejected.
        reason: String,
    },

    /// Paths could not be resolved.
    #[error(transparent)]
    Paths(#[from] PathsError),
}

impl From<ConfigError> for SlateError {
    fn from(error: ConfigError) -> Self {
        match error {
            ConfigError::Paths(inner) => Self::from(inner),
            other => Self::Config(other.to_string()),
        }
    }
}
