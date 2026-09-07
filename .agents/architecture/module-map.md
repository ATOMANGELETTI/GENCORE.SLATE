# Module map

Where everything lives, and what depends on what. Consult this before creating
a new file — most things already have a home.

## Rust crates

Dependencies point downward only. `slate-core` depends on nothing internal.

```
                        ┌──────────────┐
                        │  slate-core  │  types, errors, ids, version
                        └──────┬───────┘
             ┌─────────────────┼─────────────────┐
             ▼                 ▼                 ▼
      ┌────────────┐    ┌────────────┐    ┌────────────┐
      │ slate-paths│    │  slate-ipc │    │ slate-db   │
      └─────┬──────┘    └─────┬──────┘    └─────┬──────┘
            │                 │                 │
            ▼                 ▼                 │
      ┌──────────────┐  ┌──────────────┐        │
      │ slate-config │  │ slate-broker │        │
      └──────┬───────┘  └──────┬───────┘        │
             └────────┬────────┴────────────────┘
                      ▼
             ┌─────────────────┐      ┌───────────────┐
             │  slate-runtime  │◀─────│ slate-process │
             └────────┬────────┘      └───────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
 launcher-core  terminal-core  explorer-core
        │             │             │
        ▼             ▼             ▼
 slate-launcher  slate-terminal  slate-explorer   (tauri/*/src-tauri)
```

| Crate           | Owns                                                            | Never does                                    |
| --------------- | --------------------------------------------------------------- | --------------------------------------------- |
| `slate-core`    | `SlateError`, `AppId`, `SuiteVersion`, shared serde types        | Touch the filesystem                          |
| `slate-paths`   | Portable-root discovery, every path in the suite, escape guards  | Ask the OS where anything belongs             |
| `slate-config`  | Layered TOML config, defaults, validation                        | Cache paths of its own                        |
| `slate-db`      | SQLite connections, migrations, typed repositories               | Contain domain logic                          |
| `slate-ipc`     | Broker wire protocol, client, named-pipe transport               | Know about any specific app                   |
| `slate-broker`  | Broker server, subscriptions, single-instance guard              | Run as its own process                        |
| `slate-runtime` | Tauri shell: windows, chrome commands, theme, vibrancy, logging  | Contain app-specific behaviour                |
| `slate-process` | Child-process spawning and supervision, portable env injection   | Decide *what* to launch                       |
| `slate-shim`    | The `Slate.exe` entry point at the portable root                 | Anything but exec the Launcher                |
| `launcher-core` | App discovery, the `AppProvider` trait, the installed registry   | Draw anything                                 |
| `terminal-core` | Session traits and a stubbed backend                             | Spawn a real PTY (not yet implemented)        |
| `explorer-core` | Directory listing, sorting, entry model, scoped to `storage/`    | Escape the portable root                      |
| `slate-testing` | Temporary portable-root fixtures for tests                       | Ship in a release binary                      |

## TypeScript packages

```
@slate/tokens ──▶ @slate/ui-kit ──▶ tauri/* frontends
@slate/icons  ──┘        ▲
@slate/bindings ──▶ @slate/ipc ──┘
@slate/utils ───────────┘
```

| Package             | Owns                                                        |
| ------------------- | ----------------------------------------------------------- |
| `@slate/tokens`     | Design tokens; generates `tokens.css` and the Tailwind theme |
| `@slate/ui-kit`     | Every shared component, plus `AppShell`/`TitleBar`/`StatusBar` |
| `@slate/icons`      | The icon set and the traffic-light glyphs                    |
| `@slate/bindings`   | Types shared with Rust — the IPC contract                    |
| `@slate/ipc`        | Typed command invocation and event subscription              |
| `@slate/utils`      | Small pure helpers with real names                           |
| `@slate/testing`    | Bun test setup, render helpers, fixtures                     |
| `config-typescript` | The tsconfig bases every project extends                     |
| `config-vite`       | The shared Vite config factory for Tauri frontends           |

## Applications

Each app under `tauri/` has the same shape — see
`.agents/rules/03-naming-and-structure.md`. The frontend never imports from
another app, and `src-tauri` never imports another app's crate.

## Where does this go?

| I am adding…                          | It goes in                            |
| ------------------------------------- | ------------------------------------- |
| A colour, radius, or duration         | `@slate/tokens`                       |
| A component two apps will use         | `@slate/ui-kit`                       |
| A component only one app will use     | That app's `src/components/`          |
| A path                                | `slate-paths` — never anywhere else   |
| A Tauri command                       | That app's `src-tauri/src/commands/`  |
| Behaviour two apps' backends need     | A crate, usually `slate-runtime`      |
| A cross-app message                   | `slate-ipc`, plus a `@slate/bindings` type |
| A build or release step               | `scripts/`, wired into `moon.yml`     |
