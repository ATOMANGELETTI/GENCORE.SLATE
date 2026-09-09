# Getting Started & Developer Setup

GENCORE.SLATE is a portable, Windows-only desktop suite built with Rust, Tauri v2,
and React. This guide walks you through setting up a local development environment
from scratch on Windows.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             DEVELOPER SETUP PIPELINE                             │
│                                                                                  │
│   ┌──────────────┐      ┌──────────────┐      ┌──────────────┐      ┌─────────┐  │
│   │ Windows 10/11│ ───▶ │ Bun + Rustup │ ───▶ │ WebView2 CAB │ ───▶ │ Dev Run │  │
│   │  MSVC Tools  │      │     Moon     │      │ Verification │      │ & Check │  │
│   └──────────────┘      └──────────────┘      └──────────────┘      └─────────┘  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. System Requirements

Before cloning the repository, ensure your Windows machine meets the following criteria:

| Requirement | Minimum | Recommended | Notes |
| --- | --- | --- | --- |
| **Operating System** | Windows 10 (Build 1809+) | Windows 11 (Build 22H2+) | Target platform is Windows x64 only |
| **JavaScript Runtime** | [Bun](https://bun.sh) `1.4.2` | Bun `1.4.2` (exact) | **Node.js, npm, pnpm, and Yarn are forbidden** |
| **Rust Toolchain** | Rust `1.85+` (MSVC) | Controlled by `rust-toolchain.toml` | Target: `x86_64-pc-windows-msvc` |
| **C++ Build Tools** | VS Build Tools 2022 | VS Community 2022 | Needed for compiling native Windows C/C++ dependencies |
| **Task Orchestrator** | [Moon](https://moonrepo.dev) `2.5+` | Moon latest stable | Manages the monorepo task graph |
| **Shell** | PowerShell 7+ | PowerShell 7.4+ (`pwsh`) | Windows PowerShell 5.1 is supported but pwsh is preferred |

> [!IMPORTANT]
> **Bun Only.** Node.js is not used anywhere in this project. Do not run `npm install` or `pnpm i`.
> All package management, script execution, and frontend tests are run through Bun.

---

## 2. Toolchain Installation

### A. Install Bun
Open PowerShell and install Bun:
```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```
Verify the installation:
```powershell
bun --version # Expected: >= 1.4.2
```

### B. Install Visual Studio C++ Build Tools
Tauri and Rust on Windows require the MSVC C++ compiler and Windows SDK:
1. Download the [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/).
2. In the installer, select the **Desktop development with C++** workload.
3. Ensure **MSVC v143 - VS 2022 C++ x64/x86 build tools** and **Windows 10/11 SDK** are checked.

### C. Install Rust via Rustup
Install the standard Rust toolchain manager:
```powershell
Invoke-WebRequest -Uri https://win.rustup.rs/x86_64 -OutFile rustup-init.exe
.\rustup-init.exe -y
```
Ensure the default host triple is MSVC:
```powershell
rustup default stable-x86_64-pc-windows-msvc
```
Inside the repository, Rustup automatically reads [`rust-toolchain.toml`](file:///c:/Users/DUSTI/Documents/Development/Projects/GENCORE/GENCORE.SLATE/rust-toolchain.toml)
to provision the pinned compiler version and components (`clippy`, `rustfmt`, `llvm-tools`).

Install the cargo testing runner:
```powershell
cargo install cargo-nextest --locked
```

### D. Install Moon
Install Moon for monorepo task orchestration:
```powershell
powershell -c "irm https://moonrepo.dev/install.ps1 | iex"
```

---

## 3. Clone & Dependencies

Clone the repository and install workspace dependencies:

```powershell
git clone https://github.com/ATOMANGELETTI/GENCORE.SLATE.git
cd GENCORE.SLATE

# Install all JavaScript and TypeScript dependencies across packages and Tauri apps
bun install
```

> [!NOTE]
> `bun install` respects `bunfig.toml` which enforces exact version pinning (`exact = true`).
> Never commit `package-lock.json` or `pnpm-lock.yaml`.

---

## 4. One-Time WebView2 Setup

GENCORE.SLATE ships as a self-contained portable suite carrying its own fixed-version
WebView2 runtime (see [`docs/webview2.md`](file:///c:/Users/DUSTI/Documents/Development/Projects/GENCORE/GENCORE.SLATE/docs/webview2.md)).

While development builds can temporarily fall back to the host system's WebView2,
caching the pinned fixed-version CAB ensures you test against the exact rendering
engine shipped to users.

1. Check current cache status:
   ```powershell
   bun run scripts/bun-webview2.ts --status
   ```
2. Download the **Fixed Version x64 CAB** matching the version in [`webview2.lock.json`](file:///c:/Users/DUSTI/Documents/Development/Projects/GENCORE/GENCORE.SLATE/webview2.lock.json) from:
   <https://developer.microsoft.com/microsoft-edge/webview2/>
3. Extract and cache the archive:
   ```powershell
   $env:SLATE_WEBVIEW2_CAB = "$HOME\Downloads\Microsoft.WebView2.FixedVersionRuntime.<version>.x64.cab"
   bun run webview2:fetch
   ```

---

## 5. Running Applications in Development

To start an application with live frontend hot-reloading and backend recompilation:

```powershell
# Run the Launcher (central session owner & app launcher)
bun run dev:launcher

# Run the File Explorer (scoped to portable storage/)
bun run dev:explorer

# Run the Terminal emulator
bun run dev:terminal
```

### The Development Portable Root
Running `bun run dev:*` invokes [`scripts/bun-dev.ts`](file:///c:/Users/DUSTI/Documents/Development/Projects/GENCORE/GENCORE.SLATE/scripts/bun-dev.ts).
It automatically:
- Scaffolds a development portable root at `installDir/`.
- Creates the `.slate-root` marker file so Rust path discovery succeeds.
- Seeds configuration files in `installDir/appdata/config/` without overwriting existing changes.
- Sets `SLATE_DEV_ROOT` and launches `bunx tauri dev`.

---

## 6. UI Kit Component Gallery

To design or inspect UI components in isolation without launching the Tauri desktop shell:

```powershell
bun run gallery
```
Opens the Vite component gallery at `http://localhost:1430/gallery/` in your browser.
Every component can be previewed in both Dark and Light themes.

---

## 7. Verifying Your Setup

Run the full monorepo check before submitting changes:

```powershell
# Complete verification: formatting, linting, typechecking, tests, and builds
bun run check

# Or individual stages:
bun run lint           # Biome linter
bun run lint:rust      # Clippy with all warnings denied
bun run typecheck      # TypeScript compilation check
bun run test           # TS & Rust test suites
```

---

## 8. Common Windows Gotchas & Troubleshooting

### PowerShell Script Execution Policy
If `bun`, `moon`, or scripts fail with `File cannot be loaded because running scripts is disabled on this system`:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Windows Long Paths
Rust builds with deep dependency trees may exceed the legacy 260-character `MAX_PATH` limit:
1. Open PowerShell as Administrator.
2. Enable long paths:
   ```powershell
   New-ItemProperty -Path "Registry::HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
   ```
3. Enable long paths in Git:
   ```powershell
   git config --system core.longpaths true
   ```

### Port Conflicts
The UI Kit gallery runs on port `1430` (strict). If the port is in use, check for orphaned
node/bun processes in Task Manager.
