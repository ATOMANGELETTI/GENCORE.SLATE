//! Shared vocabulary for the GENCORE.SLATE suite.
//!
//! Every other crate depends on this one, and this one depends on nothing
//! internal. It holds only types with no behaviour of their own: the error
//! type that crosses the IPC boundary, application identifiers, and the suite
//! version.
//!
//! It never touches the filesystem. Anything that resolves a path belongs in
//! [`slate-paths`](../slate_paths/index.html).

pub mod error;
pub mod id;
pub mod version;

pub use error::{Result, SlateError};
pub use id::{AppId, KnownApp, Vendor};
pub use version::{PROTOCOL_VERSION, SCHEMA_VERSION, SuiteVersion};
