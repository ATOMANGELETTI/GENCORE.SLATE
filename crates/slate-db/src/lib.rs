//! Local storage for the suite.
//!
//! SQLite, compiled into the binary via rusqlite's `bundled` feature, so there
//! is nothing to install and nothing that can be missing on a machine the
//! portable drive is plugged into (ADR 0006). The database lives at
//! `appdata/database/slate.db` — inside the portable root, like everything
//! else the suite writes.
//!
//! ```no_run
//! use slate_db::Database;
//! use slate_paths::SlatePaths;
//!
//! let paths = SlatePaths::discover()?;
//! let database = Database::open(&paths)?;   // migrations run here
//! # Ok::<(), Box<dyn std::error::Error>>(())
//! ```
//!
//! This crate owns connections, migrations, and typed access. It holds no
//! domain logic: what a row *means* belongs in the `*-core` crate that owns
//! that concept.

pub mod error;
pub mod migrations;
pub mod pool;

pub use error::DbError;
pub use pool::Database;
