# Inter-Process Communication & Broker

GENCORE.SLATE uses a two-tier IPC architecture to manage communication both
within individual application processes and across separate executables in the suite.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                 IPC ARCHITECTURE                                 │
│                                                                                  │
│   TIER 1: Intra-Process (Webview ↔ Backend)                                      │
│   React Frontend ──invoke("get_window_state")──▶ Tauri Command                   │
│   React Frontend ◀──emit("slate://event")─────── App Handle                      │
│                                                                                  │
│   TIER 2: Inter-Process (App ↔ App via Launcher Broker)                          │
│   ┌────────────────┐         Named Pipe Bus          ┌────────────────┐          │
│   │ slate-terminal │ ───┐  (\\.\pipe\gencore.slate)  │ slate-explorer │          │
│   └────────────────┘    │                            └────────────────┘          │
│                         ▼                                     ▲                  │
│               ┌───────────────────┐                           │                  │
│               │   IPC Broker      │ ──────────────────────────┘                  │
│               │ (slate-launcher)  │                                              │
│               └───────────────────┘                                              │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Tier 1: Webview ↔ Backend (Intra-Process)

The intra-process channel connects the React webview to the application's local Rust backend.

### Command Execution
- Commands are defined in `src-tauri/src/commands/` using `#[tauri::command]`.
- All commands return a typed `Result<T, SlateError>`. Panics are never allowed across the IPC bridge.
- Frontend code calls commands through [`@slate/ipc`](file:///c:/Users/DUSTI/Documents/Development/Projects/GENCORE/GENCORE.SLATE/packages/slate-ipc):
  ```typescript
  // Recommended typed call
  import { getWindowState } from '@slate/ipc';
  const state = await getWindowState();

  // FORBIDDEN: Raw untyped invoke
  // import { invoke } from '@tauri-apps/api/core';
  // const state = await invoke('get_window_state');
  ```

### Event Streaming
- Backends emit events using `app_handle.emit("slate://<topic>", payload)`.
- Frontends listen using type-safe subscriber utilities in `@slate/ipc`.

---

## 2. Tier 2: App ↔ App (Cross-Process Broker)

When separate applications need to interact (for example, File Explorer requesting Terminal
to open a directory, or Launcher tracking active instances), they communicate through the
**central IPC broker**.

### Why Launcher Hosts the Broker (ADR 0003)
The Launcher is the session owner: it is what the user opens first, and it already oversees
application lifetimes. Hosting the broker inside `slate-launcher` avoids introducing a
fourth daemon executable and simplifies lifecycle management.

> [!IMPORTANT]
> **Standalone Resilience.** Applications must remain fully operational even if the broker
> is unreachable. If the Launcher closes or the named pipe is severed, client applications
> log a warning and continue operating with cross-app features disabled. They never crash
> or block application startup.

---

## 3. Windows Named Pipe Transport

Cross-process communication uses Windows Named Pipes:

```
\\.\pipe\gencore.slate.<hash-of-portable-root>
```

### The Root Hash Isolation Mechanism
The pipe name includes a cryptographic hash of the suite's normalized portable root path.
This enables multiple instances of GENCORE.SLATE — such as one on a USB drive and another
on an internal drive — to execute simultaneously without cross-talk or broker conflicts.

---

## 4. Wire Framing & Protocol

The broker wire protocol uses **length-prefixed NDJSON** framing:

```
┌──────────────────────────┬────────────────────────────────────────────────────────┐
│  Length: 4 bytes (u32 LE)│  JSON Payload (UTF-8 Encoded String)                   │
│  0x28 0x00 0x00 0x00     │  {"type":"Hello","app":"slate-explorer","pid":1234}    │
└──────────────────────────┴────────────────────────────────────────────────────────┘
```

- **Prefix:** 32-bit unsigned integer (little-endian) representing payload byte length.
- **Payload:** Strict JSON. JSON was selected over binary formats because it allows live
  stream debugging and tracing in logs while keeping serialization overhead negligible.

---

## 5. Protocol Message Schemas

Defined in [`crates/slate-ipc/src/protocol.rs`](file:///c:/Users/DUSTI/Documents/Development/Projects/GENCORE/GENCORE.SLATE/crates/slate-ipc):

### Handshake & Requests
```rust
pub enum Request {
    /// Initial handshake sent immediately upon connection
    Hello {
        app: AppId,
        pid: u32,
    },
    /// Publish an event to all subscribers of a topic
    Publish {
        topic: String,
        payload: serde_json::Value,
    },
    /// Subscribe to events on a specific topic
    Subscribe {
        topic: String,
    },
    /// Query all currently running applications registered with the broker
    ListApps,
}
```

### Responses
```rust
pub enum Response {
    /// Handshake acknowledgement containing protocol version
    Welcome {
        protocol_version: u16,
    },
    /// General success confirmation
    Ok,
    /// Response to ListApps
    Apps(Vec<RunningApp>),
    /// Typed error notification
    Error(SlateError),
}
```

### Broadcast Events
```rust
pub enum Event {
    AppStarted(AppId),
    AppStopped(AppId),
    ConfigChanged { section: String },
}
```

---

## 6. Version Negotiation

Every connection begins with a `Request::Hello`. The broker responds with `Response::Welcome`:

1. If the client receives a protocol version incompatible with its compiled expectations,
   it immediately disconnects and logs the mismatch.
2. It does not attempt to guess or degrade message formats.
3. Breaking changes to protocol schemas require incrementing `PROTOCOL_VERSION` in `slate-ipc`
   and issuing a major changeset.

---

## 7. Security & Input Validation

Because named pipes are an external operating system interface, **broker messages are
treated as untrusted input**:

1. Payloads are strictly validated against known Rust types before processing.
2. Path parameters crossing the IPC boundary must pass through `SlatePaths::resolve_within()`
   to prevent directory traversal attacks.
3. The broker operates purely as a message dispatcher — it contains zero domain logic and
   never makes file modification decisions on behalf of clients.

