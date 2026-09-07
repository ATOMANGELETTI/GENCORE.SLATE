//! The stubbed backend.

use parking_lot::Mutex;

use crate::session::{GridSize, Session, SessionError, SessionId, SessionSpec, TerminalBackend};

/// A backend that implements the trait and starts nothing.
///
/// The Terminal ships as a template in this scaffold, so there is deliberately
/// no ConPTY here yet. This type exists so the application can be wired end to
/// end — commands registered, state managed, UI rendered — against the real
/// interface, and so the day the PTY lands, only this file is replaced.
///
/// It also keeps the security posture honest: `slate-terminal`'s Tauri
/// capability grants no process or shell permission, because there is nothing
/// yet that needs one. Granting it in advance would be granting it to nothing.
#[derive(Debug, Default)]
pub struct StubBackend {
    /// Sessions that were requested, kept so the UI has something coherent to
    /// display and so tests can assert on what was asked for.
    requested: Mutex<Vec<SessionSpec>>,
}

impl StubBackend {
    /// Creates an empty stub backend.
    pub fn new() -> Self {
        Self::default()
    }

    /// The session specifications that were requested.
    pub fn requested(&self) -> Vec<SessionSpec> {
        self.requested.lock().clone()
    }
}

impl TerminalBackend for StubBackend {
    fn open(&self, spec: SessionSpec) -> Result<Session, SessionError> {
        self.requested.lock().push(spec);
        Err(SessionError::NotImplemented)
    }

    fn write(&self, _id: SessionId, _bytes: &[u8]) -> Result<(), SessionError> {
        Err(SessionError::NotImplemented)
    }

    fn resize(&self, _id: SessionId, _size: GridSize) -> Result<(), SessionError> {
        Err(SessionError::NotImplemented)
    }

    fn close(&self, _id: SessionId) -> Result<(), SessionError> {
        Err(SessionError::NotImplemented)
    }

    fn sessions(&self) -> Vec<Session> {
        Vec::new()
    }
}
