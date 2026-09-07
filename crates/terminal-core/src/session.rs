//! The terminal session model.

use camino::Utf8PathBuf;
use serde::{Deserialize, Serialize};
use slate_core::SlateError;
use uuid::Uuid;

/// Identifies one terminal session.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(transparent)]
pub struct SessionId(Uuid);

impl SessionId {
    /// Creates a new identifier.
    pub fn new() -> Self {
        Self(Uuid::new_v4())
    }
}

impl Default for SessionId {
    fn default() -> Self {
        Self::new()
    }
}

impl std::fmt::Display for SessionId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

/// The terminal grid's dimensions, in cells.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GridSize {
    /// Columns.
    pub columns: u16,
    /// Rows.
    pub rows: u16,
}

impl Default for GridSize {
    fn default() -> Self {
        Self {
            columns: 80,
            rows: 24,
        }
    }
}

/// How to start a session.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionSpec {
    /// The shell to run. `None` means the configured default.
    pub shell: Option<String>,
    /// Working directory, relative to the portable root.
    ///
    /// Relative on purpose: an absolute path would let a caller start a shell
    /// anywhere on the host, which is precisely what the portable boundary
    /// exists to prevent.
    pub working_directory: Option<String>,
    /// Initial grid size.
    pub size: GridSize,
}

/// A session's lifecycle state.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "state", rename_all = "camelCase")]
pub enum SessionState {
    /// Created but not yet started.
    Pending,
    /// Running.
    Running,
    /// Finished.
    #[serde(rename_all = "camelCase")]
    Exited {
        /// The exit code, if the platform reported one.
        code: Option<i32>,
    },
    /// Failed to start or died unexpectedly.
    #[serde(rename_all = "camelCase")]
    Failed {
        /// What went wrong.
        reason: String,
    },
}

/// A session and what is known about it.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Session {
    /// Its identifier.
    pub id: SessionId,
    /// How it was started.
    pub spec: SessionSpec,
    /// Where it is in its lifecycle.
    pub state: SessionState,
    /// The resolved working directory, relative to the portable root.
    pub working_directory: Utf8PathBuf,
}

/// Something a terminal backend can fail at.
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum SessionError {
    /// The backend is not implemented.
    ///
    /// The only error the stubbed backend produces. It exists as a distinct
    /// variant rather than a generic failure so that a caller — or a test —
    /// can tell "not built yet" apart from "tried and failed".
    #[error("the terminal backend is not implemented in this build")]
    NotImplemented,

    /// No session with that identifier.
    #[error("no session {0}")]
    UnknownSession(SessionId),

    /// The session has already finished.
    #[error("session {0} has exited")]
    Exited(SessionId),

    /// The requested shell is not allowed or does not exist.
    #[error("shell {shell:?} is not available: {reason}")]
    Shell {
        /// The requested shell.
        shell: String,
        /// Why it was refused.
        reason: String,
    },
}

impl From<SessionError> for SlateError {
    fn from(error: SessionError) -> Self {
        match error {
            SessionError::UnknownSession(_) => Self::NotFound(error.to_string()),
            SessionError::NotImplemented => Self::Internal(error.to_string()),
            other => Self::Process(other.to_string()),
        }
    }
}

/// What a terminal backend must provide.
///
/// The trait is defined now, ahead of any implementation, so the application
/// and its tests are written against an interface rather than against whatever
/// a PTY library happens to expose. When the real ConPTY backend arrives it
/// implements this and nothing above it changes.
pub trait TerminalBackend: Send + Sync {
    /// Starts a session.
    ///
    /// # Errors
    ///
    /// Returns [`SessionError::Shell`] if the shell cannot be used, or
    /// [`SessionError::NotImplemented`] from the stub.
    fn open(&self, spec: SessionSpec) -> Result<Session, SessionError>;

    /// Writes input to a session.
    ///
    /// # Errors
    ///
    /// Returns [`SessionError::UnknownSession`] or [`SessionError::Exited`].
    fn write(&self, id: SessionId, bytes: &[u8]) -> Result<(), SessionError>;

    /// Tells a session its grid changed size.
    ///
    /// # Errors
    ///
    /// As [`TerminalBackend::write`].
    fn resize(&self, id: SessionId, size: GridSize) -> Result<(), SessionError>;

    /// Ends a session.
    ///
    /// # Errors
    ///
    /// Returns [`SessionError::UnknownSession`].
    fn close(&self, id: SessionId) -> Result<(), SessionError>;

    /// Every session the backend knows about.
    fn sessions(&self) -> Vec<Session>;
}
