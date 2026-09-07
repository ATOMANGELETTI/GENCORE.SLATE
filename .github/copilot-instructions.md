<!--
  GENERATED FILE — DO NOT EDIT.

  Source: .agents/rules/
  Regenerate: bun run agents:sync

  Edits here are overwritten by the next sync and rejected by CI
  (`bun run agents:check`). Change the rule in .agents/ instead.
-->

# GitHub Copilot instructions — GENCORE.SLATE

A portable, Windows-only desktop suite built with Rust, Tauri v2, and React.
Bun is the only JavaScript runtime and package manager. Moon orchestrates the
monorepo. Path-specific rules live in `.github/instructions/`.

## Project overview

A **portable, Windows-only suite of desktop applications** built with Rust,
Tauri v2, and React. The entire product lives inside a single directory the user
can put anywhere — a USB stick, `D:\Tools`, a synced folder — and is distributed
as a zip, never as an installer.

## The applications

| App              | Purpose                                                                       |
| ---------------- | ----------------------------------------------------------------------------- |
| `slate-launcher` | Launches the suite's apps and third-party portable apps. Hosts the IPC broker. |
| `slate-terminal` | Terminal emulator. Currently a template; the PTY backend is stubbed.           |
| `slate-explorer` | File manager, scoped to the portable `storage/` tree.                          |

## Repository layout

```
crates/      Rust libraries shared by every app
packages/    TypeScript libraries — design tokens, UI kit, IPC client
tauri/       The three applications (frontend + src-tauri backend)
installDir/  The portable layout: what ships inside the zip
scripts/     Bun automation — dev, packaging, versioning, agent docs
.agents/     Source of truth for these rules
tests/e2e/   Cross-application end-to-end tests
```

## Invariants

These are not preferences. Breaking one is a defect, not a style disagreement.

1. **Bun only.** No Node.js, npm, pnpm, or Yarn anywhere — including CI.
2. **Nothing is written outside the portable root.** No registry keys, no
   `%APPDATA%`, no `%TEMP%`. Every path comes from `slate-paths`.
3. **Tests live in `tests/` directories.** Never beside the code they test, in
   any language.
4. **One version for the whole suite.** Written by tooling, never by hand.
5. **The UI is built from `@slate/ui-kit`.** Apps do not invent their own
   buttons, dialogs, or colours.
6. **Generated files are never edited.** Change the source and regenerate.

## Where to look next

- Structure and naming → `.agents/rules/03-naming-and-structure.md`
- Portability mechanics → `.agents/rules/09-portability.md`
- The module map → `.agents/architecture/module-map.md`
- Why a decision was made → `.agents/architecture/adr/`

## Tooling — Bun only

## Bun is the only JavaScript runtime and package manager

There is no Node.js in this project. Not as a runtime, not as a package
manager, not in CI, not "just for this one script".

| Instead of               | Use                            |
| ------------------------ | ------------------------------ |
| `npm install` / `pnpm i` | `bun install`                  |
| `npx <tool>`             | `bunx <tool>`                  |
| `node script.js`         | `bun run script.ts`            |
| `jest` / `vitest`        | `bun test`                     |
| `dotenv`                 | Bun loads `.env` automatically |
| `fs.promises.readFile`   | `Bun.file(path).text()`        |
| `child_process.exec`     | Bun's `$` shell tag            |
| the `glob` package       | `new Bun.Glob(pattern)`        |

Scripts are TypeScript, executed directly by Bun. No build step, no
transpilation, no `ts-node` equivalent.

If `package-lock.json`, `pnpm-lock.yaml`, or `yarn.lock` appears, a foreign
package manager was used: delete the file, delete `node_modules`, and rerun
`bun install`. Those filenames are in `.gitignore` precisely so the mistake
cannot be committed.

## Versions

Always the newest stable release. When adding a dependency, look the version up
rather than recalling one:

```bash
bun info <package> version      # npm
cargo search <crate> --limit 1  # crates.io
```

Versions are pinned exactly — `bunfig.toml` sets `exact = true`. Ranges let two
machines resolve different trees from the same manifest, which is exactly the
bug class a monorepo must not have.

## The toolchain

| Tool    | Role                                       | Config                              |
| ------- | ------------------------------------------ | ----------------------------------- |
| Bun     | Runtime, package manager, test runner      | `bunfig.toml`                       |
| Moon    | Task orchestration, caching, project graph | `.moon/`                            |
| Cargo   | Rust build and test                        | `Cargo.toml`, `.cargo/config.toml`  |
| Biome   | Format and lint for TS/JS/JSON/CSS         | `biome.json`                        |
| rustfmt | Format for Rust                            | `rustfmt.toml`                      |
| Clippy  | Lint for Rust                              | `clippy.toml`                       |
| Vite    | Frontend dev server and bundler            | `tauri/*/vite.config.ts`            |
| Tauri   | Desktop shell                              | `tauri/*/src-tauri/tauri.conf.json` |

## Running things

Prefer Moon over calling tools directly — it caches, and it understands the
dependency graph:

```bash
bun run check                 # lint + typecheck + test + build, everything
moon run slate-launcher:dev   # one task in one project
moon run :build               # the build task in every project
bun run dev:launcher          # convenience wrapper around the above
```

## Naming and file structure

The goal is that a file's path tells you what it is before you open it, and
that every folder holds exactly one kind of thing.

## Folders

Folders are `kebab-case` and named for a **concern**, not a layer of
abstraction:

```
src/context-menu/     src/commands/     src/layout/
src/state/            src/hooks/        src/events/
```

`utils/`, `helpers/`, `misc/`, and `common/` are banned. They are where code
goes to become unfindable. If something is genuinely shared, it belongs in
`packages/slate-utils` with a name that says what it does.

## TypeScript files: `<subject>.<role>.<ext>`

The subject comes first so that related files sort together:

```
titlebar.context-menu.ts       tray.context-menu.ts
window.commands.ts             session.commands.ts
settings.store.ts              window.store.ts
use-window-state.hook.ts       use-theme.hook.ts
button.component.tsx           button.variants.ts        button.types.ts
paths.service.ts               format-bytes.util.ts
```

Recognised roles: `component`, `hook`, `store`, `service`, `commands`,
`events`, `context-menu`, `menu`, `layout`, `provider`, `types`, `variants`,
`util`, `config`, `constants`, `schema`, `test`.

Every folder that exports outward has an `index.ts` that re-exports its public
surface. Import from the folder, not from a file inside it.

## Rust files: the folder carries the role

**Rust cannot use the TypeScript convention.** A module name must be a valid
identifier, and `window.commands.rs` is not — `mod window.commands;` will not
compile. So Rust inverts the pattern: the folder is the role, the file is the
subject.

```
src/commands/window.rs      ← not window.commands.rs
src/commands/session.rs
src/commands/mod.rs         ← re-exports the folder's public surface
src/menu/tray.rs
src/setup/logging.rs
src/state/app.rs
```

Same modular intent, expressed the way each language allows. Do not attempt to
force dots into Rust filenames.

## Tests

Tests live in `tests/`, never beside the source. This applies to both
languages — see `.agents/rules/10-testing.md` for the full rule and its
consequences.

The test path mirrors the source path:

```
src/context-menu/titlebar.context-menu.ts
tests/unit/context-menu/titlebar.context-menu.test.ts
```

## Naming inside code

| Kind                       | Convention                     | Example                        |
| -------------------------- | ------------------------------ | ------------------------------ |
| TypeScript type, component | `PascalCase`                   | `TitleBarProps`, `StatusBar`   |
| TypeScript value, function | `camelCase`                    | `resolveInstallDir`            |
| TypeScript constant        | `SCREAMING_SNAKE_CASE`         | `DEFAULT_WINDOW_WIDTH`         |
| React hook                 | `use` prefix                   | `useWindowState`               |
| Rust type, trait           | `PascalCase`                   | `SlatePaths`, `AppProvider`    |
| Rust function, module      | `snake_case`                   | `resolve_install_dir`          |
| Tauri command              | `snake_case`, verb first       | `get_window_state`             |
| CSS custom property        | `--slate-<category>-<name>`    | `--slate-bg-surface`           |
| Crate                      | `slate-` prefix, or `*-core`   | `slate-paths`, `launcher-core` |
| npm package                | `@slate/<name>`                | `@slate/ui-kit`                |

Booleans read as assertions: `isVisible`, `hasFocus`, `canLaunch` — never
`visible`, `focus`, `launchable`.

## Portability

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

## Testing

## Tests live in `tests/`. Always.

No test file sits beside the code it tests, in either language. No
`__tests__` folder next to a component. No `#[cfg(test)] mod tests` at the
bottom of a Rust file.

```
packages/slate-ui-kit/src/button/button.component.tsx
packages/slate-ui-kit/tests/button/button.component.test.tsx

crates/slate-paths/src/discover.rs
crates/slate-paths/tests/discover.rs

tauri/slate-launcher/src/state/window.store.ts
tauri/slate-launcher/tests/unit/state/window.store.test.ts
```

**The consequence for Rust is deliberate.** Integration tests can only reach a
crate's public API, so anything worth testing must be public and properly
documented. That is a design constraint, not an obstacle: if a private
function needs direct testing, it usually wants to be its own public unit in
its own module. Do not add an inline test module to get around this.

## What to test

| Layer                | Focus                                                        |
| -------------------- | ------------------------------------------------------------ |
| `slate-paths`        | Every discovery branch, and every escape attempt it rejects   |
| `slate-config`       | Layer precedence, malformed input, defaults                   |
| `slate-ipc`          | Round-trip encode/decode, version mismatch, disconnect        |
| `slate-db`           | Migrations apply cleanly and are idempotent                   |
| `*-core` crates      | Domain logic, with the filesystem behind a fixture            |
| `@slate/ui-kit`      | Rendering, variants, keyboard interaction, accessible names   |
| App stores           | State transitions, not React internals                        |
| `tests/e2e/`         | One smoke path per app: it launches, renders, and closes      |

Test behaviour, not implementation. A test that breaks when a function is
renamed but nothing observable changed is a maintenance cost with no benefit.

## Writing them

Name the test for the behaviour it pins down:

```ts
test('titlebar traffic lights desaturate when the window loses focus', () => { ... });
```

```rust
#[test]
fn discover_rejects_paths_that_escape_the_portable_root() { ... }
```

Never touch the real filesystem, the real registry, or a real network. Rust
tests build a temporary portable root with `slate-testing`; TypeScript tests
use the fixtures in `@slate/testing`.

Every bug fix starts with a failing test that reproduces it. A fix without one
is an invitation for the same bug to come back.

## Running

```bash
bun run test          # everything, through Moon
bun test              # TypeScript only
cargo test-all        # Rust only (alias for cargo nextest)
bun run test:e2e      # end-to-end, needs a built app
bun run coverage      # Rust coverage via cargo-llvm-cov
```

Coverage is a signal, not a target. 100% coverage of getters proves nothing;
one good test of `slate-paths` discovery is worth fifty of those.

## Agent workflow

## Before writing code

1. Read the rule that governs the area you are touching. They are short and
   specific for exactly this reason.
2. Look at how the neighbouring code already does it. Consistency with the
   surrounding module beats a better idea imported from elsewhere.
3. Check `.agents/architecture/module-map.md` to find where something belongs
   before creating a new file.
4. If a decision seems questionable, check `.agents/architecture/adr/` — it may
   already have been made deliberately, with reasons.

## While writing code

- Put the file in the right folder with the right name **first**. Moving files
  later churns imports and history.
- Use the existing abstraction. `slate-paths` for paths, `@slate/ui-kit` for
  UI, `@slate/tokens` for values, `slate-ipc` for cross-app messaging. Adding a
  parallel way to do something that already has one is the most common failure
  mode in this repository.
- Write the test in `tests/`, at the mirrored path, as you go.

## Before saying you are done

Run it. Not "this should work" — run it:

```bash
bun run check
```

If the change touches paths, packaging, or process spawning, also verify
portability per `.agents/rules/09-portability.md`. If it touches the UI, look
at it in both themes.

Report what actually happened. If a test fails, say so and show the output. If
part of the task was skipped, say which part and why. A confident summary of
work that was not verified is worse than no summary.

## Never

- Edit a file with a `DO NOT EDIT` banner. Edit `.agents/` and run
  `bun run agents:sync`.
- Introduce npm, pnpm, yarn, or Node.js.
- Put a test beside the code it tests.
- Hard-code a colour, spacing value, or duration outside `@slate/tokens`.
- Resolve a path from anything other than `slate-paths`.
- Add a Tauri permission wider than the feature needs.
- Bump a version number by hand.
- Silence a lint with an allow attribute instead of fixing the cause.

## When blocked

Say so, and say precisely where. A wrong guess that compiles is far more
expensive than a question — especially in the portability and IPC layers, where
a mistake is invisible until a user's machine behaves differently from the
developer's.
