# Portability & Storage Architecture

The defining constraint of GENCORE.SLATE is **complete self-containment**. A user must
be able to place the suite directory on a USB flash drive, an external SSD, or a secondary
drive (`D:\Tools`), run it on any Windows 10 or 11 computer, and leave behind zero traces.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             PORTABLE ENCAPSULATION                               │
│                                                                                  │
│   Windows Host System                     GENCORE.SLATE Encapsulated Root        │
│   ┌───────────────────────────┐           ┌──────────────────────────────────┐   │
│   │ Registry       [NO WRITE] │           │ installDir/                      │   │
│   │ %APPDATA%      [NO WRITE] │ ──BLOCKED─┼─▶ ├── Slate.exe                  │   │
│   │ %LOCALAPPDATA% [NO WRITE] │           │   ├── .slate-root                │   │
│   │ %TEMP%         [NO WRITE] │           │   ├── appdata/  (Internal Data)  │   │
│   │ User Profile   [NO WRITE] │           │   ├── programs/ (Executables)    │   │
│   └───────────────────────────┘           │   └── storage/  (User Documents) │   │
│                                           └──────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

> [!CAUTION]
> **Zero Host Pollution.** A single registry entry, stray temp file, or cache
> folder written to `%APPDATA%` breaks the product's core promise. This rule outranks
> convenience in every architectural decision.

---

## 1. Forbidden APIs & OS Interrogation

The following operating system hooks are banned across all crates and frontends:

| Forbidden Action | Banned API | Approved Alternative |
| --- | --- | --- |
| Resolving temp directory | `std::env::temp_dir()` | `paths.temp_dir()` (`appdata/temp`) |
| Resolving user folders | `directories::*` crate | `paths.storage_dir()` |
| Reading current working dir | `std::env::current_dir()` | Lexical paths via `SlatePaths` |
| Writing to Windows Registry | `winreg::*`, `RegCreateKeyEx` | TOML configs in `appdata/config/` |
| Standard application data | `%APPDATA%`, `%LOCALAPPDATA%` | `appdata/` inside portable root |

Clippy actively denies these forbidden APIs in [`clippy.toml`](file:///c:/Users/DUSTI/Documents/Development/Projects/GENCORE/GENCORE.SLATE/clippy.toml).
Never bypass these checks with an `#[allow(...)]` attribute.

---

## 2. Path Discovery Algorithm (`slate-paths`)

Applications never guess or hard-code filesystem paths. Every directory is obtained
from the [`SlatePaths`](file:///c:/Users/DUSTI/Documents/Development/Projects/GENCORE/GENCORE.SLATE/crates/slate-paths)
abstraction, which resolves locations using a three-tier discovery hierarchy:

```
                  ┌────────────────────────────────────────┐
                  │ SlatePaths::discover() Resolution Flow │
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼
                      Is SLATE_INSTALL_DIR set in env?
                                ├── YES ──▶ Use specified path as root
                                │
                                └── NO
                                      │
                                      ▼
                     Walk upward from current_exe()
                     looking for `.slate-root` marker
                                ├── FOUND ─▶ Use marker folder as root
                                │
                                └── NOT FOUND
                                      │
                                      ▼
                        Is SLATE_DEV_ROOT set or
                        is this a debug build?
                                ├── YES ──▶ Use <repo>/installDir
                                │
                                └── NO ──▶ FAIL: Refuse to boot
```

1. **`SLATE_INSTALL_DIR` Environment Variable:**
   Set by `Slate.exe` and `slate-launcher` when spawning child processes.
2. **Directory Tree Walk:**
   Starting from the executable's directory, walks parent directories until finding
   the `.slate-root` marker file.
3. **Development Fallback:**
   In development builds only, falls back to `SLATE_DEV_ROOT` or the `<repo>/installDir`
   folder.

If all three checks fail, the application deliberately **aborts immediately** rather
than falling back to host system directories.

---

## 3. Lexical Path Confinement

External inputs — including file paths from IPC requests, launcher commands, and UI drag-and-drop —
are treated as untrusted.

```rust
// crates/slate-paths/src/resolve.rs
pub fn resolve_within(&self, base: &Path, relative: &Path) -> Result<PathBuf, SlatePathError>
```

### Why Escapes Fail Rather Than Clamp
If an input references a path outside the permitted root (e.g. `../../Windows/System32` or `C:\Users\Alice`),
`SlatePaths::resolve_within()` returns an explicit `SlatePathError::EscapesRoot` error.

> [!WARNING]
> **Do not clamp out-of-bounds paths.** Clamping silently redirects a caller to the root folder
> when they requested an external location. Failing with an error exposes bugs and prevents
> accidental file deletion or information leakage.

---

## 4. The Portable Root Layout

The distribution layout is declared in [`scripts/lib/install-layout.ts`](file:///c:/Users/DUSTI/Documents/Development/Projects/GENCORE/GENCORE.SLATE/scripts/lib/install-layout.ts):

```
installDir/
├── Slate.exe                     Root launcher shim
├── .slate-root                   Manifest: version, schema, layout
│
├── appdata/                      Internal suite data (written at runtime)
│   ├── binaries/
│   │   └── webview2/             Bundled fixed-version WebView2 runtime
│   ├── config/
│   │   ├── suite.toml            Settings shared across all applications
│   │   ├── launcher.toml         Launcher configuration
│   │   ├── terminal.toml         Terminal settings & profiles
│   │   └── explorer.toml         File explorer view preferences
│   ├── database/
│   │   └── slate.db              Embedded SQLite database
│   ├── logs/
│   │   └── <app>-YYYY-MM-DD.log  Rolling daily log files
│   ├── resources/                Shared asset cache and icons
│   └── webview2/
│       └── <app>/                Per-application browser profile & cache
│
├── programs/                     Executables
│   ├── gencore/slate/            The suite's own applications
│   ├── portableapps.com/         Third-party apps in PortableApps format
│   └── portapps.io/              Third-party apps in portapps.io format
│
└── storage/                      User documents and files
    ├── desktop/  documents/  downloads/
    ├── music/    pictures/   videos/
```

### Root Zones Explained

- **`appdata/`**: The **only** area modified by the suite during ordinary runtime operations.
- **`programs/`**: Read-only during execution. Modified only when installing or updating portable applications.
- **`storage/`**: The user's files. By default, `slate-explorer` scopes file browsing exclusively to this folder.

---

## 5. WebView2 Redirection

By default, the Microsoft WebView2 control creates user data folders in `%LOCALAPPDATA%`.
To preserve portability, `slate-runtime::bootstrap` sets the following environment variables
as the **first lines of execution in `main()`** before any webview instance is created:

```rust
// Redirection in crates/slate-runtime/src/bootstrap.rs
unsafe {
    // Redirect browser profile (cookies, cache, localStorage) into appdata/
    std::env::set_var("WEBVIEW2_USER_DATA_FOLDER", paths.webview2_user_data(app_id));

    // Point to bundled fixed-version runtime rather than host Edge
    if paths.webview2_runtime().join("msedgewebview2.exe").exists() {
        std::env::set_var("WEBVIEW2_BROWSER_EXECUTABLE_FOLDER", paths.webview2_runtime());
    }
}
```

This guarantees:
1. Browser state, IndexedDB, and cache never leak into `%LOCALAPPDATA%`.
2. The suite executes against the pinned, offline WebView2 runtime.

---

## 6. Verifying Portability

After making changes to path resolution, configuration, or packaging:

1. Build the release package:
   ```powershell
   bun run package:release
   ```
2. Unpack `dist/SLATE-<version>-win-x64.zip` to a fresh location (e.g. `C:\SlateTest\`).
3. Run `Slate.exe`, launch every application, change settings, and create terminal tabs.
4. Verify that no new folders were created under `%APPDATA%`, `%LOCALAPPDATA%`, or `%TEMP%`.
5. Check Windows Registry using `reg query` to confirm no entries were added under `HKEY_CURRENT_USER\Software`.
