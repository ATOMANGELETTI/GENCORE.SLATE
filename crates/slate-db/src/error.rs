//! Database failures.

use camino::Utf8PathBuf;
use slate_core::SlateError;

/// Something went wrong opening, migrating, or querying the database.
#[derive(Debug, thiserror::Error)]
pub enum DbError {
    /// The database file could not be created or opened.
    #[error("could not open {path}: {reason}")]
    Open {
        /// The database file.
        path: Utf8PathBuf,
        /// The underlying failure.
        reason: String,
    },

    /// No connection could be obtained from the pool.
    #[error("no database connection available: {0}")]
    Pool(String),

    /// A migration failed, or the recorded history does not match the
    /// embedded set.
    ///
    /// Always fatal. Continuing against a half-migrated schema corrupts data
    /// rather than merely failing.
    #[error("database migration failed: {0}")]
    Migration(String),

    /// A query failed.
    #[error("query failed: {0}")]
    Query(String),
}

impl From<rusqlite::Error> for DbError {
    fn from(error: rusqlite::Error) -> Self {
        Self::Query(error.to_string())
    }
}

impl From<DbError> for SlateError {
    fn from(error: DbError) -> Self {
        Self::Database(error.to_string())
    }
}
