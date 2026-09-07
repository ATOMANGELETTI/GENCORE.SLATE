//! The terminal session model.
//!
//! **The PTY backend is deliberately not implemented.** The Terminal ships as
//! a template in this scaffold, so what exists here is the interface —
//! [`TerminalBackend`] — plus a [`StubBackend`] that satisfies it and starts
//! nothing.
//!
//! That is a design choice, not an omission. Defining the trait first means
//! the application, its commands, and its tests are all written against an
//! interface rather than against whatever API a PTY library happens to expose,
//! so the real ConPTY implementation replaces one file instead of rippling
//! outward.
//!
//! It also keeps the security posture honest: `slate-terminal`'s Tauri
//! capability grants no shell or process permission, because nothing here
//! needs one yet.
//!
//! ## Implementing the real backend
//!
//! 1. Add a `ConptyBackend` implementing [`TerminalBackend`].
//! 2. Grant the narrowest capability the spawn actually requires.
//! 3. Resolve every working directory through `slate-paths` — a shell started
//!    outside the portable root breaks the suite's central promise.
//! 4. Keep [`StubBackend`] for tests that must not start a process.

pub mod session;
pub mod stub;

pub use session::{
    GridSize, Session, SessionError, SessionId, SessionSpec, SessionState, TerminalBackend,
};
pub use stub::StubBackend;
