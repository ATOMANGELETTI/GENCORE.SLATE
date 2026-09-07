//! Cross-application messaging.
//!
//! The suite ships three separate executables. When they need to cooperate —
//! the Launcher tracking what is running, Explorer asking Terminal to open at
//! a directory, a setting changed in one window reaching the others — they do
//! it through the broker, never directly.
//!
//! This crate owns the contract: the [`protocol`] message shapes, the
//! [`frame`] encoding, the [`address`] the broker listens on, and the
//! [`client`] every application uses. The broker itself lives in
//! `slate-broker` and is hosted inside the Launcher (ADR 0003).
//!
//! ```no_run
//! use camino::Utf8Path;
//! use slate_core::KnownApp;
//! use slate_ipc::{topics, BrokerClient};
//!
//! // Returns None when no broker is running, which is a normal, degraded mode.
//! if let Some(mut client) = BrokerClient::try_connect(Utf8Path::new("D:/Slate"), KnownApp::Terminal.id()) {
//!     client.subscribe(topics::CONFIG)?;
//! }
//! # Ok::<(), slate_ipc::IpcError>(())
//! ```
//!
//! # Rules
//!
//! - An application never opens a connection to another application. One hub
//!   means one place to audit, log, and version.
//! - The broker moves messages and holds no domain logic.
//! - A message from the broker is untrusted input, validated exactly as
//!   strictly as a command arriving from the webview.
//! - Every failure here is non-fatal. Applications must run standalone.

pub mod address;
pub mod client;
pub mod error;
pub mod frame;
pub mod protocol;

pub use address::{broker_pipe_name, root_fingerprint};
pub use client::BrokerClient;
pub use error::IpcError;
pub use frame::{MAX_FRAME_BYTES, read_frame, write_frame};
pub use protocol::{Event, Request, Response, RunningApp, topics};
