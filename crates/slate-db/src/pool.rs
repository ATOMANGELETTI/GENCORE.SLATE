//! Connection pooling and database lifecycle.

use camino::Utf8PathBuf;
use r2d2::Pool;
use r2d2_sqlite::SqliteConnectionManager;
use rusqlite::Connection;
use slate_paths::SlatePaths;

use crate::error::DbError;
use crate::migrations;

/// How many connections to keep.
///
/// SQLite serialises writes regardless, so a large pool buys nothing; this is
/// sized for a few concurrent readers and one writer.
const POOL_SIZE: u32 = 4;

/// The suite's database.
#[derive(Debug, Clone)]
pub struct Database {
    pool: Pool<SqliteConnectionManager>,
    path: Utf8PathBuf,
}

impl Database {
    /// Opens the database, creating and migrating it if necessary.
    ///
    /// # Errors
    ///
    /// Returns [`DbError::Open`] if the file cannot be created or opened, or
    /// [`DbError::Migration`] if migrations fail — which is fatal rather than
    /// recoverable: continuing against a half-migrated schema would corrupt
    /// data rather than merely fail.
    pub fn open(paths: &SlatePaths) -> Result<Self, DbError> {
        let path = paths.database_file();

        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).map_err(|error| DbError::Open {
                path: path.clone(),
                reason: error.to_string(),
            })?;
        }

        let manager = SqliteConnectionManager::file(path.as_std_path()).with_init(configure);
        let pool = Pool::builder()
            .max_size(POOL_SIZE)
            .build(manager)
            .map_err(|error| DbError::Open {
                path: path.clone(),
                reason: error.to_string(),
            })?;

        let database = Self { pool, path };
        // PooledConnection derefs to Connection; the migration runner takes the
        // underlying connection so it can hold it mutably for the whole run.
        migrations::run(&mut *database.connection()?)?;

        Ok(database)
    }

    /// Opens an in-memory database with migrations applied.
    ///
    /// For tests only. A pool size of one is required: every connection to
    /// `:memory:` gets its own separate database, so a larger pool would hand
    /// out connections to empty, unmigrated databases.
    ///
    /// # Errors
    ///
    /// As [`Database::open`].
    pub fn in_memory() -> Result<Self, DbError> {
        let manager = SqliteConnectionManager::memory().with_init(configure);
        let pool = Pool::builder()
            .max_size(1)
            .build(manager)
            .map_err(|error| DbError::Open {
                path: Utf8PathBuf::from(":memory:"),
                reason: error.to_string(),
            })?;

        let database = Self {
            pool,
            path: Utf8PathBuf::from(":memory:"),
        };
        // PooledConnection derefs to Connection; the migration runner takes the
        // underlying connection so it can hold it mutably for the whole run.
        migrations::run(&mut *database.connection()?)?;

        Ok(database)
    }

    /// Borrows a connection from the pool.
    ///
    /// # Errors
    ///
    /// Returns [`DbError::Pool`] if no connection becomes available.
    pub fn connection(&self) -> Result<r2d2::PooledConnection<SqliteConnectionManager>, DbError> {
        self.pool
            .get()
            .map_err(|error| DbError::Pool(error.to_string()))
    }

    /// Where the database file lives.
    pub fn path(&self) -> &camino::Utf8Path {
        &self.path
    }
}

/// Settings applied to every connection as it is created.
fn configure(connection: &mut Connection) -> rusqlite::Result<()> {
    // WAL lets readers proceed during a write. It creates -wal and -shm
    // sidecar files, which is fine: they sit beside the database inside the
    // portable root.
    connection.pragma_update(None, "journal_mode", "WAL")?;
    // NORMAL rather than FULL: on a removable drive the extra fsync per commit
    // is expensive, and WAL already protects against application crashes. The
    // exposure is a power loss mid-commit, which for local preferences and
    // launch history is an acceptable trade.
    connection.pragma_update(None, "synchronous", "NORMAL")?;
    connection.pragma_update(None, "foreign_keys", "ON")?;
    // Fail after five seconds rather than blocking a UI thread indefinitely.
    connection.busy_timeout(std::time::Duration::from_secs(5))?;

    Ok(())
}
