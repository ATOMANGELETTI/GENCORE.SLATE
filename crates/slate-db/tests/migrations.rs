//! Schema migrations and connection setup.

use slate_db::Database;

#[test]
fn an_in_memory_database_comes_up_migrated() {
    let database = Database::in_memory().expect("the database opens");
    let connection = database.connection().expect("a connection is available");

    let tables: Vec<String> = connection
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
        .expect("the query prepares")
        .query_map([], |row| row.get(0))
        .expect("the query runs")
        .collect::<Result<_, _>>()
        .expect("rows read");

    for expected in ["installed_app", "launch_history", "preference"] {
        assert!(
            tables.iter().any(|name| name == expected),
            "missing {expected}: {tables:?}"
        );
    }
}

#[test]
fn foreign_keys_are_enforced() {
    // SQLite disables them by default, which would make launch_history's
    // reference to installed_app decorative unless switched on per connection.
    let database = Database::in_memory().expect("the database opens");
    let connection = database.connection().expect("a connection is available");

    let enabled: i64 = connection
        .query_row("PRAGMA foreign_keys", [], |row| row.get(0))
        .expect("the pragma reads");

    assert_eq!(enabled, 1);
}

#[test]
fn a_row_violating_a_foreign_key_is_rejected() {
    let database = Database::in_memory().expect("the database opens");
    let connection = database.connection().expect("a connection is available");

    let result = connection.execute(
        "INSERT INTO launch_history (app_id, launched_at) VALUES (?1, ?2)",
        rusqlite::params!["nonexistent", "2026-01-01T00:00:00Z"],
    );

    assert!(result.is_err(), "the reference must be enforced");
}

#[test]
fn running_migrations_twice_is_harmless() {
    let database = Database::in_memory().expect("the database opens");
    let mut connection = database.connection().expect("a connection is available");

    slate_db::migrations::run(&mut connection).expect("a second run is a no-op");

    let version = slate_db::migrations::current_version(&connection).expect("the version reads");
    assert_eq!(version, Some(1));
}

#[test]
fn preferences_are_unique_per_scope_and_key() {
    let database = Database::in_memory().expect("the database opens");
    let connection = database.connection().expect("a connection is available");

    connection
        .execute(
            "INSERT INTO preference (scope, key, value, updated_at) VALUES (?1, ?2, ?3, ?4)",
            rusqlite::params!["suite", "theme", "dark", "2026-01-01T00:00:00Z"],
        )
        .expect("the first insert succeeds");

    let duplicate = connection.execute(
        "INSERT INTO preference (scope, key, value, updated_at) VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params!["suite", "theme", "light", "2026-01-02T00:00:00Z"],
    );

    assert!(
        duplicate.is_err(),
        "the primary key must prevent a duplicate"
    );
}

#[test]
fn an_installed_app_row_round_trips() {
    let database = Database::in_memory().expect("the database opens");
    let connection = database.connection().expect("a connection is available");

    connection
        .execute(
            "INSERT INTO installed_app \
             (id, vendor, display_name, relative_path, executable, discovered_at, updated_at) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            rusqlite::params![
                "slate-terminal",
                "gencore",
                "Terminal",
                "programs/gencore/slate/slate-terminal",
                "programs/gencore/slate/slate-terminal/slate-terminal.exe",
                "2026-01-01T00:00:00Z",
                "2026-01-01T00:00:00Z",
            ],
        )
        .expect("the insert succeeds");

    let executable: String = connection
        .query_row(
            "SELECT executable FROM installed_app WHERE id = ?1",
            ["slate-terminal"],
            |row| row.get(0),
        )
        .expect("the row reads back");

    // Relative, so the database survives the install being copied elsewhere.
    assert!(!executable.contains(':'));
}
