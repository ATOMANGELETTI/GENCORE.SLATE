# ADR 0006 — SQLite through rusqlite, with the bundled feature

**Status:** Accepted · **Date:** 2026-09-06

## Context

The suite needs durable local storage for the installed-app registry, launch
history, and preferences that outgrow a TOML file. It must work with no system
dependency whatsoever, since the product is a folder a user copies between
machines.

## Decision

SQLite, accessed through `rusqlite` with the `bundled` feature, pooled with
`r2d2`, and migrated with `refinery`. The database lives at
`appdata/database/slate.db`.

`bundled` compiles SQLite into the binary. Nothing is linked from the host, so
there is nothing to install and nothing to be missing.

## Consequences

**Good**

- Zero runtime dependency; perfectly portable.
- SQL, so queries and indexes are available without hand-rolling them.
- The file is inspectable with any SQLite tool, which is invaluable for support.
- `refinery` keeps migrations versioned and idempotent, and they are tested.

**Bad**

- Compiling SQLite adds to build time and to binary size.
- Synchronous access, so a slow query on a Tauri command thread would block the
  UI. `.agents/rules/07-rust.md` requires long work to be spawned.

## Rejected

**SQLx** — compile-time-checked queries are attractive, but it needs a live
database at build time and pulls in a large async stack for a workload that is
neither concurrent nor remote.

**redb** — pure Rust and excellent, but a key-value store means writing our own
indexes and queries for data that is naturally relational.

**TOML and JSON files only** — right for configuration, which is why config
still uses them, but wrong for history and registries that need querying.

## Note on `bun:sqlite`

Bun's built-in SQLite is used for **scripts and tests only**. Application data
is owned by the Rust side; the frontend never opens the database directly.
