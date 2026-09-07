//! Portable path resolution — the foundation of the suite's defining promise.
//!
//! GENCORE.SLATE runs from any directory and writes nothing outside it. That
//! guarantee lives entirely in this crate: every path used anywhere in the
//! suite is derived from a [`SlatePaths`] value, and no other code is
//! permitted to ask the operating system where anything belongs.
//!
//! ```no_run
//! use slate_paths::SlatePaths;
//!
//! let paths = SlatePaths::discover()?;
//! paths.ensure_layout()?;
//!
//! let database = paths.database_file();
//! let logs = paths.logs_dir();
//! # Ok::<(), slate_paths::PathsError>(())
//! ```
//!
//! # How the guarantee is enforced
//!
//! Three layers, because one is not enough:
//!
//! 1. **Lint.** `clippy.toml` denies `std::env::temp_dir`,
//!    `std::env::current_dir`, `std::env::home_dir`, and the `directories`
//!    crate, so the usual shortcuts do not compile.
//! 2. **Type.** Callers receive paths from `SlatePaths`; anything arriving from
//!    outside the process goes through [`SlatePaths::resolve_within`], which
//!    rejects escapes.
//! 3. **Test.** The suite in `tests/` covers every discovery branch and every
//!    escape attempt, so a regression in the guard fails the build rather than
//!    reaching a user's drive.
//!
//! See ADR 0004 for why discovery uses a marker file, and
//! `.agents/rules/09-portability.md` for the rules that depend on this crate.

pub mod discover;
pub mod error;
pub mod marker;
pub mod paths;

pub use discover::{ENV_DEV_ROOT, ENV_INSTALL_DIR, discover_root, find_marker_upward};
pub use error::PathsError;
pub use marker::{MARKER_FILE, RootMarker};
pub use paths::{SlatePaths, StorageKind};
