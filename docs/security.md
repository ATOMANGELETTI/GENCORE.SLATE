# Security, Capabilities & Sandboxing

GENCORE.SLATE is designed with a defense-in-depth model tailored for offline,
portable desktop software on Windows.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                THREAT BOUNDARIES                                 │
│                                                                                  │
│   Untrusted External Content       Webview Sandbox              Native Backend   │
│   ┌────────────────────────┐      ┌─────────────────────────┐  ┌───────────────┐ │
│   │ External File Names    │ ───▶ │ Strict CSP              │  │ Tauri Command │ │
│   │ Directory Metadata     │      │ withGlobalTauri: false  │  │ Validation    │ │
│   │ Untrusted Named Pipes  │      │ Banned innerHTML        │  │ Control Flow  │ │
│   │ Archive Payloads       │      │ Offline Bundled Assets  │  │ Guard (CFG)   │ │
│   └────────────────────────┘      └───────────┬─────────────┘  └───────┬───────┘ │
│                                               │ invoke("...")          │         │
│                                               ▼                        ▼         │
│                                  Validated Typed Request ──▶ Path Confinement   │
│                                                              (slate-paths)       │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Threat Model

The webview frontends render local application assets, but they also display **arbitrary
external metadata** — file names, path hierarchies, terminal outputs, and application
manifests — which could contain malicious payloads.

> [!IMPORTANT]
> **Boundary Philosophy:**
> - Treat all data entering the webview as **untrusted content**.
> - Treat all requests crossing from the webview into the Rust backend as **untrusted input**.

---

## 2. Tauri v2 Capability Manifests

Tauri v2 enforces fine-grained permissions via capability files located in
`tauri/<app>/src-tauri/capabilities/`. Every application operates with the **least privilege**
necessary:

- **Specific Permissions:** Permissions are added only when a specific, reviewed feature
  requires them. Wildcards like `fs:default` or `shell:allow-execute` are banned.
- **`slate-explorer` Scoping:** The filesystem capability is strictly scoped to the portable
  `storage/**` directory. It is denied access to host Windows directories (`C:\Windows`, `C:\Users`).
- **`slate-terminal` Restriction:** Until the native PTY backend is fully implemented,
  `slate-terminal` holds **no** shell or process execution permissions.

---

## 3. Content Security Policy (CSP)

Each application enforces a strict, local-only Content Security Policy in its `tauri.conf.json`:

```text
default-src 'self';
script-src 'self';
style-src 'self';
img-src 'self' asset: data:;
font-src 'self';
connect-src 'self' ipc: http://ipc.localhost;
object-src 'none';
frame-src 'none';
base-uri 'none';
```

### Security Benefits
- **Zero Remote Origins:** Prevents cross-site scripting (XSS) attacks from loading remote scripts or assets.
- **Offline Reliability:** All fonts, SVGs, and stylesheets are bundled into the application.
- **Prototype Hardening:** Applications enable `freezePrototype: true` and set `withGlobalTauri: false`
  so that malicious frontend scripts cannot inspect or tamper with `window.__TAURI__`.
- **Banned `dangerouslySetInnerHTML`:** Direct HTML injection is disallowed in React components.

---

## 4. Backend Command Validation

Tauri commands (`#[tauri::command]`) represent the primary trust boundary between
frontend JavaScript and native Rust:

1. **Strictly Typed Parameters:** Commands take explicit Rust structs — never free-form
   `serde_json::Value` objects.
2. **Lexical Path Verification:** Any file path argument is verified against `slate-paths`.
   If a path attempts directory traversal (`../`), execution halts with an error.
3. **Structured Errors:** Commands return `Result<T, SlateError>`, providing predictable,
   typed error codes without exposing backend stack traces.

---

## 5. Windows Exploit Mitigations

Rust compilation options in [`.cargo/config.toml`](file:///c:/Users/DUSTI/Documents/Development/Projects/GENCORE/GENCORE.SLATE/.cargo/config.toml)
enforce Windows-specific binary hardening:

```toml
[target.x86_64-pc-windows-msvc]
rustflags = [
    # Enable Windows Control-Flow Guard (CFG) mitigation against ROP attacks
    "-C", "control-flow-guard=yes",
]
```

All binaries are compiled as Position Independent Executables (ASLR) with Data Execution
Prevention (DEP) enabled by default.

---

## 6. Secrets & Credentials Policy

Portable software must never store credentials or private keys in plaintext configuration
files inside the zip directory.

- **No Committed Secrets:** Repository ignores `.env.local`.
- **Windows Credential Manager:** Sensitive credentials (such as API keys or remote tokens)
  are stored via the Windows Credential Manager API, scoped securely to the local Windows user profile.

---

## 7. Known Security Limitations

To maintain transparency, the following design constraints are documented:

- **Unsigned Binaries:** Release zip files are currently unsigned. Windows Defender SmartScreen
  will display a prompt on first run until code signing (via Azure Trusted Signing) is integrated.
- **Local Directory Trust:** Portable applications inherit the file permissions of their containing
  folder. If a user installs the suite in a directory writable by untrusted users, those users could
  modify the executables. Users are advised to place the portable suite in protected user directories
  or dedicated personal drives.

