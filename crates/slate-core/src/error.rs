//! The error type that crosses process and language boundaries.

use serde::Serialize;

/// A convenience alias for fallible suite operations.
pub type Result<T, E = SlateError> = core::result::Result<T, E>;

/// The error surface exposed to the webview and to other applications.
///
/// Individual crates define their own richer error enums with `thiserror` and
/// convert into this type at the boundary. That keeps internal detail out of
/// the frontend while still telling the user which subsystem failed.
///
/// The `kind` tag is what the TypeScript side matches on, so the variant names
/// are part of the IPC contract — see `packages/slate-bindings`. Renaming one
/// is a breaking change.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, thiserror::Error)]
#[serde(tag = "kind", content = "message", rename_all = "camelCase")]
pub enum SlateError {
    /// A path could not be resolved, or resolving it would leave the portable root.
    #[error("path error: {0}")]
    Paths(String),

    /// Configuration was missing, unreadable, or failed validation.
    #[error("configuration error: {0}")]
    Config(String),

    /// The local database could not be opened, migrated, or queried.
    #[error("database error: {0}")]
    Database(String),

    /// Communication with the broker failed.
    #[error("ipc error: {0}")]
    Ipc(String),

    /// A child process could not be started, or exited unexpectedly.
    #[error("process error: {0}")]
    Process(String),

    /// The requested item does not exist.
    #[error("not found: {0}")]
    NotFound(String),

    /// The caller supplied something this operation cannot accept.
    ///
    /// Used for every rejected command argument. Prefer this over a panic: an
    /// argument arriving from the webview is untrusted input, not a bug.
    #[error("invalid input: {0}")]
    InvalidInput(String),

    /// An unexpected failure with no better classification.
    #[error("internal error: {0}")]
    Internal(String),
}

impl SlateError {
    /// The stable identifier the frontend matches on.
    pub fn kind(&self) -> &'static str {
        match self {
            Self::Paths(_) => "paths",
            Self::Config(_) => "config",
            Self::Database(_) => "database",
            Self::Ipc(_) => "ipc",
            Self::Process(_) => "process",
            Self::NotFound(_) => "notFound",
            Self::InvalidInput(_) => "invalidInput",
            Self::Internal(_) => "internal",
        }
    }

    /// Whether retrying the same operation could plausibly succeed.
    ///
    /// The frontend uses this to decide between offering a retry and reporting
    /// a hard failure.
    pub fn is_retryable(&self) -> bool {
        matches!(self, Self::Ipc(_) | Self::Database(_) | Self::Process(_))
    }
}

impl From<std::io::Error> for SlateError {
    fn from(error: std::io::Error) -> Self {
        Self::Internal(error.to_string())
    }
}
