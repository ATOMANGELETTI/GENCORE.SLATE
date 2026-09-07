//! The IPC broker, hosted inside the Launcher process.
//!
//! The suite ships three separate executables that occasionally need to
//! cooperate. Rather than letting them open connections to each other — which
//! would mean three places to audit and version — every message passes through
//! one broker.
//!
//! The Launcher hosts it because the Launcher is already the session owner:
//! it is what the user starts and it already supervises every child process.
//! ADR 0003 records that decision, including its cost: **applications must run
//! standalone**, so nothing here may become required for an application to
//! start.
//!
//! ```no_run
//! use camino::Utf8Path;
//!
//! match slate_broker::spawn(Utf8Path::new("D:/Slate")) {
//!     Ok(broker) => tracing::info!(address = broker.address(), "hosting the broker"),
//!     Err(error) if error.is_already_running() => {
//!         // Another Launcher owns this install; hand over rather than compete.
//!     }
//!     Err(error) => tracing::warn!(%error, "continuing without cross-application features"),
//! }
//! ```
//!
//! The broker moves messages and holds no domain logic. Every message it
//! relays is untrusted input, validated exactly as strictly as a command
//! arriving from a webview.

#[cfg(windows)]
pub mod server;

pub mod error;

pub use error::BrokerError;

#[cfg(windows)]
pub use server::{BrokerHandle, spawn};
