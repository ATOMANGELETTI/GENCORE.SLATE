# Architecture Overview

GENCORE.SLATE is an integrated suite of portable, AI-native desktop applications built
for Windows. It combines a high-performance **Rust** systems core, the **Tauri v2** desktop
framework, and a modular **React 19** frontend styled with **Tailwind CSS v4** and design tokens.

---

## 1. System Topology

The suite operates as an ecosystem of lightweight, cooperating native processes rather
than a monolithic executable. The Launcher process acts as the primary supervisor,
broker, and session host.

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                   GENCORE.SLATE TOPOLOGY                                  │
│                                                                                           │
│   ┌───────────────────────────────────────────────────────────────────────────────────┐   │
│   │                                installDir/Slate.exe                               │   │
│   │                          (Native Root Bootstrap Shim)                             │   │
│   └─────────────────────────────────────────┬─────────────────────────────────────────┘   │
│                                             │ spawns                                      │
│                                             ▼                                             │
│   ┌───────────────────────────────────────────────────────────────────────────────────┐   │
│   │                                   slate-launcher                                  │   │
│   │  ┌─────────────────────────┐                     ┌─────────────────────────────┐  │   │
│   │  │   React 19 Frontend     │                     │     Rust Backend (Tauri)    │  │   │
│   │  │ (@slate/ui-kit, Tokens) │ ◀── invoke/emit ──▶ │                             │  │   │
│   │  └─────────────────────────┘                     └──────────────┬──────────────┘  │   │
│   │                                                                 │ hosts           │   │
│   │                                                  ┌──────────────▼──────────────┐  │   │
│   │                                                  │      IPC Broker Engine      │  │   │
│   │                                                  │ (\\.\pipe\gencore.slate.*)  │  │   │
│   │                                                  └──────────────┬──────────────┘  │   │
│   └─────────────────────────────────────────────────────────────────┼─────────────────┘   │
│                                                                     │                     │
│                            Named Pipe Inter-Process Bus             │                     │
│                  ┌──────────────────────────────────────────────────┴───────────────┐     │
│                  ▼                                                                  ▼     │
│   ┌──────────────────────────────┐                   ┌──────────────────────────────┐     │
│   │        slate-terminal        │                   │        slate-explorer        │     │
│   │  ┌────────────────────────┐  │                   │  ┌────────────────────────┐  │     │
│   │  │   React Frontend       │  │                   │  │   React Frontend       │  │     │
│   │  └───────────┬────────────┘  │                   │  └───────────┬────────────┘  │     │
│   │              │               │                   │              │               │     │
│   │  ┌───────────▼────────────┐  │                   │  ┌───────────▼────────────┐  │     │
│   │  │ Rust Backend (PTY)     │  │                   │  │ Rust Backend (Storage) │  │     │
│   │  └────────────────────────┘  │                   │  └────────────────────────┘  │     │
│   └──────────────────────────────┘                   └──────────────────────────────┘     │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. The Applications

| Application | Role | Core Technology | Key Responsibilities |
| --- | --- | --- | --- |
| **`slate-launcher`** | Session Owner & Broker | Tauri v2, Rusqlite, Named Pipes | Spawns child apps, registers portable apps, hosts cross-app IPC broker, manages SQLite database. |
| **`slate-explorer`** | File Manager | Tauri v2, Virtualized Grid | Scoped navigation of `storage/`, file operations, path validation, context menu integration. |
| **`slate-terminal`** | Terminal Emulator | Tauri v2, Windows ConPTY | Interactive pseudo-terminal sessions, shell profiles, terminal rendering. |

---

## 3. The Two IPC Boundaries

Communication within the suite is split into two distinct tiers:

1. **Intra-Process (Webview ↔ Backend)**
   - The standard Tauri IPC channel.
   - Frontend invokes commands via typed wrappers in [`@slate/ipc`](file:///c:/Users/DUSTI/Documents/Development/Projects/GENCORE/GENCORE.SLATE/packages/slate-ipc).
   - Rust commands in `src-tauri/src/commands/` validate inputs and return `Result<T, SlateError>`.
   - Data structures are strongly typed via [`@slate/bindings`](file:///c:/Users/DUSTI/Documents/Development/Projects/GENCORE/GENCORE.SLATE/packages/slate-bindings).

2. **Inter-Process (Application ↔ Application)**
   - Cross-executable message bus managed by the IPC broker in Launcher.
   - Operates over Windows Named Pipes (`\\.\pipe\gencore.slate.<root-hash>`).
   - Length-prefixed NDJSON wire framing.
   - Applications operate completely standalone if the broker is not running.

See [`docs/ipc.md`](file:///c:/Users/DUSTI/Documents/Development/Projects/GENCORE/GENCORE.SLATE/docs/ipc.md) for protocol details.

---

## 4. Shared Rust Crates (`crates/`)

The workspace avoids code duplication by factoring shared systems into focused, single-purpose crates:

```
crates/
├── slate-paths/     Discovery, lexical path confinement, root normalisation
├── slate-config/    Layered TOML configuration loading and serialization
├── slate-db/        SQLite embedded persistence, refinery schema migrations
├── slate-ipc/       Named pipe wire framing, broker protocols, request/event types
├── slate-runtime/   Shared Tauri lifecycle setup, logging, WebView2 redirection
├── launcher-core/   Domain logic for Launcher (app registry, scanning)
├── explorer-core/   Filesystem manipulation scoped to storage/
├── terminal-core/   PTY process management and terminal session state
└── slate-testing/   Temporary portable root test harness and mock filesystem
```

### Key Crate Responsibilities

- **`slate-paths`**: The foundational invariant enforcer. Discovers the `.slate-root` marker and guarantees that no path ever escapes the portable tree.
- **`slate-runtime`**: Sets the mandatory `WEBVIEW2_USER_DATA_FOLDER` and `WEBVIEW2_BROWSER_EXECUTABLE_FOLDER` environment variables before webview initialization.
- **`slate-db`**: Embeds SQLite via `rusqlite` with automated schema migrations. Stores history, configurations, and application metadata in `appdata/database/slate.db`.

---

## 5. Shared TypeScript Packages (`packages/`)

Frontend code is structured into modular packages managed by Bun and Moon:

```
packages/
├── slate-tokens/        CSS design tokens, color scales, radii, animation curves
├── slate-ui-kit/        Shared React components (TitleBar, Buttons, Menus, Dialogs)
├── slate-ipc/           Type-safe frontend clients for Tauri commands and broker events
├── slate-bindings/      TypeScript type definitions mirroring Rust IPC structs
├── slate-utils/         Pure utility functions (string manipulation, byte formatting)
├── slate-icons/         SVG icon assets and components
├── slate-testing/       Component test fixtures and DOM mocks
├── config-typescript/   Shared tsconfig presets with strict compiler checks
└── config-vite/         Shared Vite bundling and plugin presets
```

---

## 6. Monorepo Project Dependency Graph

Moon orchestrates the monorepo, ensuring libraries compile in dependency order and tasks
are aggressively cached:

```
@slate/tokens
      ▲
      │
@slate/ui-kit ◀──── @slate/bindings
      ▲                    ▲
      │                    │
      ├────────────────────┴─── @slate/ipc
      │                              ▲
      │                              │
┌─────┴──────────────────────────────┴─────┐
│             Tauri Applications           │
│   slate-launcher   slate-explorer   ...  │
└──────────────────────────────────────────┘
```

Inspect the live graph at any time using:
```bash
moon project-graph
```

---

## 7. The Portable Root Shim (`Slate.exe`)

At the root of the distribution sits `Slate.exe`. This is a lightweight, non-webview Rust
shim compiled directly with `cargo build --release --bin Slate`.

When double-clicked:
1. It resolves its own location.
2. Locates `programs/gencore/slate/slate-launcher/slate-launcher.exe`.
3. Injects the `SLATE_INSTALL_DIR` environment variable pointing to the portable root.
4. Executes the Launcher child process and exits cleanly.

