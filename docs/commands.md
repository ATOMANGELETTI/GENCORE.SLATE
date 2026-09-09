moon project-graph
# Developer Command Reference

bun run package
bun run package:release
GENCORE.SLATE is a portable, Windows-only desktop suite built with Rust, Tauri v2,
and React. Development and build workflows are organized across three distinct
tooling layers:

bun run webview2:fetch
1. **Bun (`bun run <script>`)** — The only JavaScript runtime and package manager.
   Orchestrates local dev runners, packaging, icon generation, and version synchronization.
2. **Moon (`moon <command>`)** — Monorepo task runner and build orchestrator. Manages
   the project dependency graph, pipeline caching, and cross-project compilation tasks.
3. **Cargo (`cargo <command>`)** — Rust toolchain for compiling native crates, running
   Clippy lints, executing Nextest suites, and generating LLVM coverage.

---

## Master Command Cheat Sheet

| Goal | Command | Layer |
| --- | --- | --- |
| **Launch Launcher (Dev)** | `bun run dev:launcher` | Bun / Tauri |
| **Launch File Explorer (Dev)** | `bun run dev:explorer` | Bun / Tauri |
| **Launch Terminal (Dev)** | `bun run dev:terminal` | Bun / Tauri |
| **Interactive App Selector** | `bun run dev` | Bun / Tauri |
| **UI Kit Component Gallery** | `bun run gallery` | Vite |
| **Inspect Project Dependency Graph** | `moon project-graph` | Moon |
| **Package Portable Suite (Dev)** | `bun run package` | Bun / Tauri / Cargo |
| **Package Portable Suite (Release)** | `bun run package:release` | Bun / Tauri / Cargo |
| **Check WebView2 Cache Status** | `bun run scripts/bun-webview2.ts --status` | Bun |
| **Verify & Cache WebView2 CAB** | `bun run webview2:fetch` | Bun / expand.exe |
| **Full Suite Verification (CI Check)**| `bun run check` | Moon (`moon check --all`) |
| **Run All Tests (TS + Rust)** | `bun run test` | Moon (`moon run :test`) |
| **Run TypeScript Tests** | `bun run test:ts` | Bun (`bun test`) |
| **Run Rust Tests** | `bun run test:rust` | Cargo (`cargo test-all`) |
| **Run End-to-End Tests** | `bun run test:e2e` | Bun / WebDriver |
| **Rust Code Coverage** | `bun run coverage` | Cargo (`cargo cov`) |
| **Lint Everything (TS/JS/JSON/CSS)** | `bun run lint` | Biome |
| **Auto-fix Lint Issues** | `bun run lint:fix` | Biome |
| **Format All Files (TS & Rust)** | `bun run format` | Biome + `cargo fmt` |
| **Lint Rust Crates** | `bun run lint:rust` | Cargo (`cargo lint`) |
| **Check Unused Dependencies** | `bun run lint:deps` | Knip |
| **Spellcheck Codebase** | `bun run lint:spelling` | CSpell |
| **Generate App Icons** | `bun run scripts/bun-icons.ts` | Bun |
| **Synchronize Agent Rules** | `bun run agents:sync` | Bun |
| **Verify Agent Rules in CI** | `bun run agents:check` | Bun |
| **Create Semantic Changeset** | `bun run changeset` | Changesets CLI |
| **Propagate Version & Changelog** | `bun run version` | Changesets + Bun |
| **Audit Supply Chain Security** | `bun run audit` | Bun + `cargo deny` |

---

## 1. Application Development

Development commands boot an individual Tauri application with hot-reloading frontend
assets and an interactive Rust debug build.

```bash
bun run dev:launcher   # Start slate-launcher
bun run dev:explorer   # Start slate-explorer
bun run dev:terminal   # Start slate-terminal
bun run dev            # Interactive prompt listing all applications
```

### What happens under the hood (`scripts/bun-dev.ts`)

Starting a Tauri app directly via raw `cargo run` or bare `tauri dev` fails
because GENCORE.SLATE enforces strict portability: every app discovers its file paths
relative to a portable root marker (`.slate-root`).

`scripts/bun-dev.ts` automates the preparation:
1. **Initializes the portable root** at `installDir/` (or the folder in `SLATE_DEV_ROOT`).
2. **Generates the `.slate-root` marker** with build ID `development` if absent.
3. **Seeds initial configuration** (e.g. `appdata/config/slate-launcher.toml`) without
   overwriting any modifications you made while testing.
4. **Passes required environment variables**:
   - `SLATE_DEV_ROOT`: Points the executable to `installDir`.
   - `SLATE_LOG=debug`: Enables detailed diagnostic logs.
   - `SLATE_LOG_CONSOLE=1`: Mirrors file log entries to the terminal console.
5. **Launches `bunx tauri dev`** inside `tauri/<app>/`.

### When to use
Use these during regular feature work and UI/backend development.

---

## 2. Packaging & Portable Distribution

Packaging commands assemble the entire portable folder tree and bundle it into a
distributable zip file (`dist/SLATE-<version>-win-x64.zip`) along with its SHA-256 checksum.

```bash
bun run package            # Development package (system WebView2 permitted)
bun run package:release    # Release package (bundled WebView2 runtime strictly required)
```

### Key Differences: `package` vs `package:release`

| Aspect | `bun run package` | `bun run package:release` |
| --- | --- | --- |
| **Primary Use** | Local smoke testing, packaging verification | Official releases, CI release builds |
| **WebView2 Runtime** | Uses bundled runtime if cached; otherwise skips with warning | **Fails immediately** if fixed-version runtime is not cached |
| **Portability Guarantee**| Partial if unbundled (relies on host Edge) | Complete (runs on offline / clean Windows machines) |

### Why apps use `tauri build --no-bundle` (not raw `cargo build`)
In `scripts/bun-package.ts`, applications are compiled via:
```bash
bunx tauri build --no-bundle
```
**Do not substitute this with `cargo build --release`.** A raw Cargo build produces a binary
that expects a live Vite dev server on localhost, resulting in a blank "can't reach this page"
window. `tauri build` executes each app's `beforeBuildCommand` (`bunx vite build`), embeds the
production assets directly into the binary, and compiles with the release profile.

The root shim (`installDir/Slate.exe`) contains no webview, so it is compiled directly with:
```bash
cargo build --release --bin Slate
```

### Verifying an existing layout
To verify that an already-assembled directory structure matches the required portable layout:
```bash
bun run scripts/bun-package.ts --verify-only dist/installDir
```

---

## 3. WebView2 Fixed-Version Runtime Management

GENCORE.SLATE bundles a **fixed-version** WebView2 runtime so the application runs
identically on any Windows machine without installing system-wide runtimes or depending
on Microsoft Edge. See [`docs/webview2.md`](file:///c:/Users/DUSTI/Documents/Development/Projects/GENCORE/GENCORE.SLATE/docs/webview2.md) and ADR 0005.

```bash
# Check if the fixed-version runtime is present in the local cache
bun run scripts/bun-webview2.ts --status
$env:SLATE_WEBVIEW2_CAB = "$HOME\Downloads\Microsoft.WebView2.FixedVersionRuntime.131.0.2903.86.x64.cab"

# Extract and cache a downloaded CAB archive
bun run webview2:fetch

bun run dev:launcher
bun run dev:explorer
bun run dev:terminal
# Manually copy the cached runtime into a target directory
bun run scripts/bun-webview2.ts --install dist/installDir/appdata/binaries/webview2
```

### Why a manual step is required
Microsoft offers a permanent link for the system-wide *evergreen bootstrapper*, but
**not** for the standalone *fixed-version* CAB archive. The archive must be downloaded
once by a developer from Microsoft's developer portal.

### Setup procedure
1. Visit <https://developer.microsoft.com/microsoft-edge/webview2/>.
2. Under **Fixed Version**, select **x64** and the version pinned in `webview2.lock.json`.
3. Set the environment variable pointing to the downloaded file:
   - **PowerShell:**
     ```powershell
     $env:SLATE_WEBVIEW2_CAB = "$HOME\Downloads\Microsoft.WebView2.FixedVersionRuntime.131.0.2903.86.x64.cab"
     ```
   - **Command Prompt (cmd):**
     ```cmd
     set SLATE_WEBVIEW2_CAB=%USERPROFILE%\Downloads\Microsoft.WebView2.FixedVersionRuntime.131.0.2903.86.x64.cab
     ```
   - **Bash:**
     ```bash
     export SLATE_WEBVIEW2_CAB="/c/Users/.../Microsoft.WebView2.FixedVersionRuntime.131.0.2903.86.x64.cab"
     ```
4. Run `bun run webview2:fetch`. The script verifies the SHA-256 against `webview2.lock.json`,
   extracts the files using Windows `expand.exe`, and caches them in `.cache/webview2/`.

---

## 4. Monorepo Orchestration with Moon

[Moon](https://moonrepo.dev/) acts as the central build coordinator, tracking dependencies
between packages and caching task outputs.

### Inspecting the Dependency Graph
```bash
moon project-graph             # Print project relationships to terminal
moon project-graph --dot       # Output DOT format for visual graph tools
moon project-graph slate-launcher  # Inspect dependency chain for a specific project
```

### Running Tasks Across the Monorepo
```bash
# Run a specific task in a specific project
moon run slate-launcher:dev
moon run slate-ui-kit:typecheck

# Run a task across all projects that implement it
moon run :typecheck            # Typecheck every project
moon run :test                 # Run tests across every project
moon run :build                # Build all web frontends and packages

# Query projects and tags
moon query projects
moon project slate-launcher
```

### Verification and CI
```bash
moon check --all               # Full workspace verification: typecheck + test + build
moon ci                        # Executes the CI test matrix
```

---

## 5. Code Quality, Formatting & Static Analysis

Before opening a PR or committing code, run the suite's quality tools:

### Workspace Verification
```bash
bun run check                  # Runs `moon check --all` across the entire workspace
```
Always run `bun run check` prior to marking any feature or bugfix complete.

### Linting (TypeScript, JavaScript, CSS, JSON)
```bash
bun run lint                   # Checks files using Biome
bun run lint:fix               # Automatically fixes safe linting and formatting issues
```

### Code Formatting
```bash
bun run format                 # Formats TS/JS/JSON/CSS with Biome and Rust with cargo fmt
bun run format:check           # Verifies formatting compliance without making changes
```

### TypeScript Type Checking
```bash
bun run typecheck              # Runs `moon run :typecheck` (executes `tsc --build` per project)
```

### Rust Linting (Clippy)
```bash
bun run lint:rust              # Runs `cargo lint` with all targets, all features, warnings as errors
cargo lint-fix                 # Runs clippy with `--fix --allow-dirty`
```

### Unused Dependency Auditing
```bash
bun run lint:deps              # Runs Knip to identify unused files, dependencies, and exports
```

### Spelling Verification
```bash
bun run lint:spelling          # Runs CSpell against markdown, code, and config files
```

---

## 6. Testing & Code Coverage

Tests are strictly decoupled from source code and reside in dedicated `tests/` directories
(see `.agents/rules/10-testing.md`).

```bash
bun run test                   # Runs tests across all projects via Moon
bun run test:ts                # Executes TypeScript unit tests using Bun's test runner
bun run test:rust              # Executes Rust unit and integration tests using Nextest
bun run test:e2e               # Runs WebDriver end-to-end smoke tests (scripts/bun-e2e.ts)
bun run coverage               # Generates Rust coverage report (`lcov.info`) via llvm-cov
```

### End-to-End Testing Notes
`bun run test:e2e` drives genuine compiled applications using `msedgedriver`.
Because debug builds connect to a Vite development server rather than embedding their frontend,
e2e tests require built release binaries in `target/release/`. If missing, run `bun run package`
first.

---

## 7. UI Kit Component Development

The shared UI library (`packages/slate-ui-kit`) contains every reusable visual component.

```bash
bun run gallery
# or directly via Bun workspace filter:
bun --filter @slate/ui-kit gallery
```

### The Component Gallery
The component gallery opens at `http://localhost:1430/gallery/` in your default browser.
It is an ordinary browser page, **not** a Tauri window. If a component cannot render in
a standard browser, it belongs in an application, not in `@slate/ui-kit`.

---

## 8. Application Asset Generation

```bash
bun run scripts/bun-icons.ts
```

Generates brand-compliant rounded-square icon sets for each application (`.ico` and PNGs
in 32x32, 128x128, 256x256):
- `slate-launcher`: Blue accent
- `slate-terminal`: Green accent
- `slate-explorer`: Yellow accent

The generator draws pure uncompressed PNG deflation chunks in code, eliminating the need
for large third-party image manipulation libraries.

---

## 9. AI Agent Documentation Synchronization

```bash
bun run agents:sync            # Compiles .agents/rules/*.md into client instruction files
bun run agents:check           # Validates that generated rule files are completely in sync
```

### Single Source of Truth
Never edit `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`, or `.agent/rules/` directly.
Always edit the source Markdown rules in `.agents/rules/` and run `bun run agents:sync`.
In CI, `bun run agents:check` rejects pull requests with out-of-sync agent files.

---

## 10. Versioning, Changesets & Security

GENCORE.SLATE enforces a single unified suite version across all applications, crates,
and npm packages (ADR 0009).

### Recording Changes
```bash
bun run changeset              # Interactive prompt to create a change summary
```

### Cutting a New Version
```bash
bun run version
```
This command:
1. Applies pending changesets and updates `CHANGELOG.md`.
2. Executes `scripts/bun-version.ts` to mirror the version from the root `package.json`
   into `[workspace.package]` in `Cargo.toml` and every `tauri.conf.json`.
3. Updates `bun.lock` to maintain consistent lockfile integrity.

### Supply Chain Security
```bash
bun run audit
```
Runs `bun audit --audit-level=moderate` for npm packages and `cargo deny check` for Rust
crates to identify known security advisories, incompatible software licenses, and unapproved
crate sources.

---

## 11. Cargo Command Aliases

Defined in [`.cargo/config.toml`](file:///c:/Users/DUSTI/Documents/Development/Projects/GENCORE/GENCORE.SLATE/.cargo/config.toml):

| Alias | Full Cargo Command | Description |
| --- | --- | --- |
| `cargo lint` | `cargo clippy --workspace --all-targets --all-features -- -D warnings` | Strict Clippy check |
| `cargo lint-fix` | `cargo clippy --workspace --all-targets --all-features --fix --allow-dirty -- -D warnings` | Automatic Clippy fixes |
| `cargo fmt-check`| `cargo fmt --all -- --check` | Verify Rust formatting |
| `cargo test-all` | `cargo nextest run --workspace --all-features` | High-speed parallel test execution |
| `cargo cov` | `cargo llvm-cov nextest --workspace --all-features --lcov --output-path lcov.info` | Coverage report generation |

---

## 12. Essential Environment Variables

| Variable | Purpose | Default | Used by |
| --- | --- | --- | --- |
| `SLATE_DEV_ROOT` | Sets the portable root directory during development | `<repo>/installDir` | `scripts/bun-dev.ts`, `slate-paths` |
| `SLATE_WEBVIEW2_CAB` | Absolute path to downloaded Fixed Version WebView2 CAB | None | `scripts/bun-webview2.ts` |
| `SLATE_LOG` | Rust log filter level (`trace`, `debug`, `info`, `warn`, `error`) | `debug` (in dev) | `slate-runtime`, `tracing-subscriber` |
| `SLATE_LOG_CONSOLE` | Enables mirroring log output to stdout/stderr (`1` or `0`) | `1` (in dev) | `slate-runtime` |
| `SLATE_INSTALL_DIR` | Absolute path to portable root in packaged builds | Set by Launcher | Production binaries |

