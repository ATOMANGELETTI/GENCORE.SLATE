# ADR 0005 — Bundle the fixed-version WebView2 runtime

**Status:** Accepted · **Date:** 2026-09-06

## Context

A Tauri app on Windows renders through WebView2. Two distributions exist:

- **Evergreen** — the system-wide runtime, present on Windows 11 and most
  Windows 10 machines, updated by Microsoft.
- **Fixed version** — a private copy the application carries and points to.

Evergreen makes the zip small, but it means the suite renders in whatever
version the machine happens to have, and fails entirely on a machine that has
had it removed. Neither is compatible with "copy this folder anywhere and it
works, identically".

## Decision

Bundle the fixed-version runtime at `appdata/binaries/webview2/`, and point
every app at it before any window is created:

```rust
unsafe { std::env::set_var("WEBVIEW2_BROWSER_EXECUTABLE_FOLDER", paths.webview2_runtime()) };
unsafe { std::env::set_var("WEBVIEW2_USER_DATA_FOLDER", paths.webview2_user_data(app_id)) };
```

The second variable matters as much as the first: without it, WebView2 writes
its user-data folder outside the portable root and the promise is broken.

## Consequences

**Good**

- Identical rendering on every machine, including ones that have never had Edge.
- The suite is genuinely self-contained — no system dependency at all.
- Rendering behaviour is pinned, so a Microsoft update cannot change the UI
  under us.

**Bad**

- The zip grows by roughly 150–200 MB. For a portable suite meant to live on a
  drive the user carries, this is a fair trade.
- Security updates to the runtime become **our** responsibility. The pinned
  version lives in `webview2.lock.json` and Renovate cannot see it, so it must
  be reviewed deliberately at each release.

## The manual step

Microsoft publishes a stable download link for the evergreen bootstrapper but
**not** for the fixed-version archive. `scripts/bun-webview2.ts` therefore
takes the `.cab` from a configured URL or the `SLATE_WEBVIEW2_CAB` path,
verifies its SHA-256 against the lockfile, and extracts it with `expand.exe`.

Development builds and CI work without it. A **release** build fails with
instructions when it is missing, rather than silently producing a zip that is
not portable. See `docs/webview2.md`.
