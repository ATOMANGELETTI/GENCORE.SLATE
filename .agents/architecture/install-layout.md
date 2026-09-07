# The portable install layout

What ships inside the zip, and what each directory is for. This layout is
declared once, in `scripts/lib/install-layout.ts`, which both builds the tree
and verifies it afterwards.

```
installDir/
├── Slate.exe                     Shim; execs the Launcher
├── .slate-root                   Marker file — see below
│
├── appdata/                      Everything the suite writes
│   ├── binaries/
│   │   └── webview2/             Bundled fixed-version WebView2 runtime
│   ├── config/
│   │   ├── suite.toml            Settings shared by every app
│   │   ├── launcher.toml         Per-app settings
│   │   ├── terminal.toml
│   │   └── explorer.toml
│   ├── database/
│   │   └── slate.db              SQLite: app registry, history, preferences
│   ├── logs/
│   │   └── <app>-YYYY-MM-DD.log  Rolling daily logs
│   ├── resources/                Shared assets (icons, seeds, templates)
│   └── webview2/
│       └── <app>/                WebView2 per-app user data
│
├── programs/                     Installed applications
│   ├── gencore/
│   │   └── slate/
│   │       ├── slate-launcher/
│   │       ├── slate-terminal/
│   │       └── slate-explorer/
│   ├── portableapps.com/         Third-party, PortableApps.com format
│   └── portapps.io/              Third-party, portapps.io format
│
└── storage/                      The user's own files
    ├── desktop/  documents/  downloads/
    ├── music/    pictures/   videos/
```

## `.slate-root`

The marker that makes discovery work. `slate-paths` walks upward from the
running executable until it finds this file, and that directory is the portable
root.

```toml
# Written by scripts/bun-package.ts. Do not edit.
[suite]
version = "0.1.0"
build_id = "2026-09-06T04:12:33Z+a1b2c3d"
schema_version = 1

[layout]
appdata = "appdata"
programs = "programs"
storage = "storage"
```

`schema_version` exists so a future release can migrate a layout produced by an
older one. Increment it whenever a directory moves or changes meaning, and add
the migration to `slate-paths`.

## Rules

- **Only `appdata/` is written at runtime.** `programs/` changes when an app is
  installed or updated; `storage/` belongs to the user; nothing else is touched.
- **`storage/` is the only place an app may show the user by default.** The
  Explorer's filesystem capability is scoped to it.
- **Third-party vendor directories keep their own conventions.** The suite
  reads them through a provider adapter and does not reorganise them —
  PortableApps.com's `appinfo.ini` layout stays exactly as that ecosystem
  expects.
- **Nothing outside `installDir` exists** as far as the suite is concerned.

## Verifying a packaged tree

```bash
bun run package
bun run scripts/bun-package.ts --verify-only dist/installDir
```

The verifier compares the produced tree against the same declarative manifest
used to build it, so a file that quietly stopped being copied fails the build
rather than shipping.
