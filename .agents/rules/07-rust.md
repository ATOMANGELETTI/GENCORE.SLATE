---
id: 07-rust
title: Rust
description: Conventions for every crate — error handling, module layout, dependencies, and the lints that are denied.
globs: ['crates/**/*.rs', 'tauri/*/src-tauri/**/*.rs', '**/Cargo.toml']
alwaysApply: false
---

# Rust

Edition 2024, pinned to the toolchain in `rust-toolchain.toml`. Clippy runs
with `pedantic` enabled and `-D warnings` in CI: a warning is a build failure.

## Errors

Libraries define their own error enum with `thiserror`. They never return
`anyhow::Error`, and they never panic on a condition a caller could handle.

```rust
#[derive(Debug, thiserror::Error)]
pub enum PathsError {
    #[error("portable root not found; searched upward from {searched_from}")]
    RootNotFound { searched_from: Utf8PathBuf },

    #[error("path {path} escapes the portable root {root}")]
    EscapesRoot { path: Utf8PathBuf, root: Utf8PathBuf },
}
```

Error messages state what failed and with which values. "invalid input" is not
an error message.

`unwrap()`, `expect()`, `panic!()`, `todo!()`, and `unimplemented!()` are lint
warnings in library code and must not reach `main`. In tests they are fine and
expected.

Binaries may use `anyhow` at the top level to add context.

## Modules

The folder is the role, the file is the subject (see
`.agents/rules/03-naming-and-structure.md`). Every folder has a `mod.rs` that
declares its children and re-exports the public surface. Nothing is `pub`
unless something outside the crate needs it — prefer `pub(crate)`.

`unsafe` is denied workspace-wide. If a Windows API genuinely requires it, the
block is confined to a single, documented function that states its safety
invariants, and it needs review before merging.

## Documentation

Every public item has a doc comment: what it does, and what it returns on
failure. Crate-level `//!` docs explain the crate's role in the suite and its
place in the dependency graph. `missing_docs` is a warning workspace-wide.

## Dependencies

Declared once in the root `[workspace.dependencies]`, referenced by members as
`serde.workspace = true`. Never write a version number in a member `Cargo.toml`
— that is how two crates end up on two versions of the same library.

Before adding a dependency, check whether the standard library or a crate
already in the graph covers it. Every dependency is a licence obligation
(`deny.toml`), an advisory surface, and binary size in a zip a user downloads.

## Async

Most of this codebase is synchronous, and that is deliberate — path resolution,
config parsing, and SQLite calls are fast and local. Use `tokio` only where
genuine concurrency exists: the IPC broker and process supervision.

Never block a Tauri command thread on long work. Spawn it and emit an event
when it completes.

## Tests

In `tests/`, never inline. See `.agents/rules/10-testing.md` for what that
implies about crate API design.
