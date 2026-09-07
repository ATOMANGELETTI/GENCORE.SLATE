-- Initial schema for the GENCORE.SLATE suite.
--
-- APPEND-ONLY. Never edit this file once it has shipped: refinery records a
-- checksum, and changing it turns every existing install's history into a
-- reported corruption. Add a new migration instead.

-- Applications the Launcher knows about, across every vendor directory.
CREATE TABLE installed_app (
    id             TEXT PRIMARY KEY,
    vendor         TEXT NOT NULL,
    display_name   TEXT NOT NULL,
    -- Relative to the portable root, never absolute: an install that is copied
    -- to another drive must keep working, and an absolute path would not.
    relative_path  TEXT NOT NULL,
    executable     TEXT NOT NULL,
    version        TEXT,
    icon_path      TEXT,
    discovered_at  TEXT NOT NULL,
    updated_at     TEXT NOT NULL
) STRICT;

CREATE INDEX idx_installed_app_vendor ON installed_app (vendor);

-- One row per launch, for recency ordering in the Launcher.
CREATE TABLE launch_history (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    app_id      TEXT NOT NULL REFERENCES installed_app (id) ON DELETE CASCADE,
    launched_at TEXT NOT NULL,
    exit_code   INTEGER,
    duration_ms INTEGER
) STRICT;

CREATE INDEX idx_launch_history_app ON launch_history (app_id, launched_at DESC);

-- Preferences too numerous or too dynamic for a TOML file. Anything a user
-- might reasonably want to edit by hand belongs in appdata/config instead.
CREATE TABLE preference (
    scope      TEXT NOT NULL,
    key        TEXT NOT NULL,
    value      TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (scope, key)
) STRICT;
