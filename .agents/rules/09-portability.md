---
id: 09-portability
title: Portability
description: The rules that keep the suite fully self-contained. This is the product's defining constraint.
globs: ['crates/**/*.rs', 'tauri/*/src-tauri/**/*.rs', 'scripts/**/*.ts']
alwaysApply: true
---

# Portability

The suite runs from anywhere and writes nothing outside its own directory. A
user must be able to copy `installDir` to another machine, run it, and find
their settings, database, and files exactly as they left them.

**One violation breaks the product's core promise.** This rule outranks
convenience every time.

## Forbidden, without exception

- Writing to `%APPDATA%`, `%LOCALAPPDATA%`, `%USERPROFILE%`, `%TEMP%`,
  `Documents`, or any other OS-owned location.
- Creating or reading registry keys.
- Installing anything, registering file associations, or adding startup entries.
- Absolute paths compiled into the binary.
- `std::env::temp_dir`, `std::env::current_dir`, `directories::*`, or any other
  API that asks the operating system where things belong. Clippy denies these
  in `clippy.toml`; do not add an allow attribute to get past it.

## Everything comes from `slate-paths`

```rust
let paths = SlatePaths::discover()?;
let db     = paths.database_dir().join("slate.db");
let config = paths.config_dir().join("launcher.toml");
let logs   = paths.logs_dir();
let docs   = paths.storage_dir().join("documents");
```

Discovery order:

1. `SLATE_INSTALL_DIR` — set by the Launcher for every child process it spawns.
2. Walk upward from `std::env::current_exe()` looking for the `.slate-root`
   marker file.
3. `SLATE_DEV_ROOT`, or `<repo>/installDir`, in development builds only.

Any path arriving from outside the process — a command argument, a third-party
manifest entry, a value from the database — goes through
`SlatePaths::resolve_within`, which normalises it lexically and returns
`EscapesRoot` rather than clamping it. Clamping would silently redirect the
caller somewhere they did not ask for; failing makes the bug visible.

## The layout

```
installDir/
├── Slate.exe                  Shim that launches the Launcher
├── .slate-root                Marker: suite version, build id, schema version
├── appdata/
│   ├── binaries/webview2/     Bundled fixed-version WebView2 runtime
│   ├── config/                TOML configuration
│   ├── database/              SQLite databases
│   ├── logs/                  Rolling logs
│   ├── resources/             Shared assets
│   └── webview2/              WebView2 per-app user data
├── programs/
│   ├── gencore/slate/         The suite's own applications
│   ├── portableapps.com/      Third-party apps from PortableApps.com
│   └── portapps.io/           Third-party apps from portapps.io
└── storage/                   The user's documents, downloads, pictures, …
```

## The WebView2 detail that makes this real

A Tauri app on Windows delegates rendering to WebView2, which by default writes
a user-data folder next to the executable *or* into `%LOCALAPPDATA%`. Both are
wrong here. Before any window is created — literally the first statements in
`main()` — the app sets:

```rust
unsafe { std::env::set_var("WEBVIEW2_USER_DATA_FOLDER", paths.webview2_user_data(app_id)) };
unsafe { std::env::set_var("WEBVIEW2_BROWSER_EXECUTABLE_FOLDER", paths.webview2_runtime()) };
```

The second line is what makes the bundled fixed-version runtime take effect, so
the suite renders identically on a machine that has never had Edge installed.

## Verifying

Portability is not something to assume. After any change that touches paths,
process spawning, or packaging:

1. `bun run package`
2. Extract the zip to a path the project has never used.
3. Run everything; open every window; change a setting.
4. Confirm nothing appeared outside that folder.

`.agents/workflows/debug-portability.md` describes how to snapshot the
filesystem and registry around the run.
