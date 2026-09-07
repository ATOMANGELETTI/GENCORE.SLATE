//! Schema migrations.
//!
//! Migrations are embedded in the binary from `migrations/`, so a portable
//! install carries everything it needs to bring its own database forward.
//!
//! # Why this is hand-written
//!
//! `refinery` is the obvious choice and was the original plan, but it pins
//! `rusqlite <= 0.37`, and `libsqlite3-sys` is a `links = "sqlite3"` crate —
//! so only one version can exist in a binary. Taking refinery would mean
//! freezing SQLite at an old version and waiting on refinery for every future
//! upgrade, in a project whose stated rule is to run the newest stable release
//! of everything.
//!
//! What refinery actually provides here is an applied-versions table, ordered
//! application inside a transaction, and a checksum that detects an edited
//! migration. That is what this module implements, in a form small enough to
//! read in one sitting.
//!
//! # The rule
//!
//! **Migrations are append-only.** Never edit one that has shipped: someone
//! has a database that already applied it, and the checksum below will report
//! the change as a corrupted history rather than silently re-running it. Write
//! a new migration instead.

use rusqlite::Connection;
use sha2::{Digest, Sha256};

use crate::error::DbError;

/// One embedded migration.
struct Migration {
    version: u32,
    name: &'static str,
    sql: &'static str,
}

/// Every migration, in the order they must be applied.
///
/// Add to the end of this list; never reorder or edit an existing entry.
const MIGRATIONS: &[Migration] = &[Migration {
    version: 1,
    name: "initial_schema",
    sql: include_str!("../migrations/V1__initial_schema.sql"),
}];

/// The table recording what has been applied.
const HISTORY_TABLE: &str = "\
CREATE TABLE IF NOT EXISTS schema_migration (
    version    INTEGER PRIMARY KEY,
    name       TEXT NOT NULL,
    checksum   TEXT NOT NULL,
    applied_at TEXT NOT NULL
) STRICT";

/// Applies every migration that has not yet run.
///
/// Idempotent: running it against an up-to-date database does nothing. Each
/// migration is applied inside a transaction together with its history row, so
/// a failure part-way leaves the database on the previous version rather than
/// half-migrated.
///
/// # Errors
///
/// Returns [`DbError::Migration`] if a migration fails, or if a migration that
/// was already applied no longer matches its recorded checksum — which means
/// a shipped migration was edited, and continuing would apply a schema nobody
/// can reason about.
pub fn run(connection: &mut Connection) -> Result<(), DbError> {
    connection.execute_batch(HISTORY_TABLE).map_err(|error| {
        DbError::Migration(format!("could not create the history table: {error}"))
    })?;

    let mut applied_count = 0;

    for migration in MIGRATIONS {
        let checksum = checksum(migration.sql);

        let recorded: Option<String> = connection
            .query_row(
                "SELECT checksum FROM schema_migration WHERE version = ?1",
                [migration.version],
                |row| row.get(0),
            )
            .ok();

        if let Some(recorded) = recorded {
            if recorded != checksum {
                return Err(DbError::Migration(format!(
                    "migration V{} ({}) has changed since it was applied\n  \
                     recorded {recorded}\n  found    {checksum}\n\
                     Migrations are append-only; write a new one instead of editing this one.",
                    migration.version, migration.name,
                )));
            }
            continue;
        }

        let transaction = connection
            .transaction()
            .map_err(|error| DbError::Migration(error.to_string()))?;

        transaction.execute_batch(migration.sql).map_err(|error| {
            DbError::Migration(format!(
                "V{} ({}) failed: {error}",
                migration.version, migration.name
            ))
        })?;

        transaction
            .execute(
                "INSERT INTO schema_migration (version, name, checksum, applied_at) \
                 VALUES (?1, ?2, ?3, datetime('now'))",
                rusqlite::params![migration.version, migration.name, checksum],
            )
            .map_err(|error| DbError::Migration(error.to_string()))?;

        transaction
            .commit()
            .map_err(|error| DbError::Migration(error.to_string()))?;

        tracing::info!(
            version = migration.version,
            name = migration.name,
            "applied migration"
        );
        applied_count += 1;
    }

    if applied_count > 0 {
        tracing::info!(count = applied_count, "database migrations applied");
    }

    Ok(())
}

/// The schema version currently applied, if any.
///
/// # Errors
///
/// Returns [`DbError::Migration`] if the history table cannot be read.
pub fn current_version(connection: &Connection) -> Result<Option<u32>, DbError> {
    connection
        .query_row("SELECT MAX(version) FROM schema_migration", [], |row| {
            row.get(0)
        })
        .map_err(|error| DbError::Migration(error.to_string()))
}

/// The highest version this build knows how to apply.
pub fn latest_version() -> u32 {
    MIGRATIONS.last().map_or(0, |migration| migration.version)
}

/// A stable checksum of a migration's text.
///
/// Line endings are normalised first: the same file checked out on two
/// machines with different `core.autocrlf` settings must produce the same
/// value, or every Windows developer sees a false corruption report.
fn checksum(sql: &str) -> String {
    let normalised = sql.replace("\r\n", "\n");
    format!("{:x}", Sha256::digest(normalised.as_bytes()))
}
