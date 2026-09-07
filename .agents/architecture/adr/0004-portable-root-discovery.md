# ADR 0004 — Portable root discovered via a `.slate-root` marker

**Status:** Accepted · **Date:** 2026-09-06

## Context

Every path the suite touches must resolve relative to a portable root that can
be anywhere and is not known at compile time. Executables sit several levels
deep inside it:

```
installDir/programs/gencore/slate/slate-terminal/slate-terminal.exe
```

Counting fixed levels upward from the executable would work — until an app is
nested differently, or a third-party provider installs to another depth. Then
it breaks silently, and a silent path bug in a portable app is the worst kind:
it appears as data written to the wrong machine.

## Decision

`slate-paths` resolves the root in this order:

1. **`SLATE_INSTALL_DIR`** — the Launcher sets this for every child it spawns,
   so the common case is a single environment read with no filesystem walking.
2. **Marker search** — walk upward from `std::env::current_exe()` until a
   `.slate-root` file is found. Depth-independent by construction.
3. **`SLATE_DEV_ROOT`, then `<repo>/installDir`** — development builds only,
   compiled out of release binaries.

If none succeeds, the app **fails to start** with a message naming every path
it searched. It never falls back to an OS directory.

`.slate-root` is TOML and carries the suite version, a build id, and a
`schema_version` that lets a future release migrate an older layout.

## Consequences

**Good**

- Apps can be nested at any depth; adding a vendor directory needs no code
  change.
- The marker is self-describing, so tooling and support can read it.
- Failing loudly means a misconfiguration surfaces immediately rather than as
  files appearing somewhere unexpected.

**Bad**

- One filesystem walk at startup for apps not launched by the Launcher.
  Negligible: a handful of `stat` calls.
- The marker can be deleted by a user, which breaks the install. Acceptable and
  visible — the error names the missing file.

## Enforcement

Discovery is useless if code bypasses it, so `clippy.toml` denies
`std::env::temp_dir`, `std::env::current_dir`, `std::env::home_dir`, and the
`directories` crate's types. `SlatePaths::resolve_within` additionally rejects
any externally supplied path that normalises to a location outside the root,
and the `slate-paths` test suite covers every discovery branch and every escape
attempt.
