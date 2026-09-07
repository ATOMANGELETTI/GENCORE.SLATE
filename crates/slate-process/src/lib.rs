//! Child-process supervision for the Launcher.
//!
//! The suite is three separate executables, and the Launcher starts the other
//! two. This crate owns that: locating the executable inside the portable
//! tree, injecting the environment a child needs to find the same portable
//! root, and noticing when one exits.
//!
//! It deliberately does **not** decide *what* to launch — that is
//! `launcher-core`'s job. This crate is told an application id and does the
//! mechanical work.

pub mod error;
pub mod spawn;

pub use error::ProcessError;
pub use spawn::{RunningProcess, Supervisor};
