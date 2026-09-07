# IPC architecture

Two distinct channels, often confused. Keep them straight.

## 1. Webview ↔ backend (per application)

The ordinary Tauri channel, inside a single process.

```
React frontend  ──invoke("get_window_state")──▶  #[tauri::command]
React frontend  ◀──emit("slate://window-state")──  app.emit(...)
```

- Commands live in `src-tauri/src/commands/`, typed, validated, returning
  `Result<T, SlateError>`.
- The frontend calls them through `@slate/ipc`, never through a raw `invoke`
  with a string literal.
- Payload types are declared once in `@slate/bindings` and mirrored by the Rust
  types they represent.

## 2. Application ↔ application (across processes)

The suite is three separate executables. When they need to talk — Explorer
asking the Terminal to open at a directory, the Launcher tracking which apps
are running — they talk through the **broker**.

```
              ┌───────────────────────────────┐
              │        slate-launcher         │
              │   ┌───────────────────────┐   │
              │   │  slate-broker (host)  │   │
              │   └───────────┬───────────┘   │
              └───────────────┼───────────────┘
                    named pipe │  \\.\pipe\gencore.slate.<root-hash>
              ┌───────────────┼───────────────┐
              ▼                               ▼
       slate-terminal                   slate-explorer
```

### Why the Launcher hosts it

The Launcher is the suite's session owner: it is what the user starts, and it
already supervises every child process. A separate broker executable would add
a fourth binary, a lifecycle to manage, and a failure mode ("the broker died
but the apps are running") for no gain.

**Apps must run standalone.** If the broker is unreachable, an app logs it once
and continues with cross-app features disabled. It never blocks startup on the
broker, and it never shows an error the user cannot act on.

### The pipe name

`\\.\pipe\gencore.slate.<hash of the portable root>`

Hashing the root is what lets two copies of the suite — one on the internal
drive, one on a USB stick — run at the same time without talking to each other.
Two apps from the same `installDir` share a broker; apps from different roots
never do.

### Messages

```rust
enum Request  { Hello { app: AppId, pid: u32 }, Publish { topic, payload }, Subscribe { topic }, ListApps }
enum Response { Welcome { protocol: u16 }, Ok, Apps(Vec<RunningApp>), Error(SlateError) }
enum Event    { AppStarted(AppId), AppStopped(AppId), ConfigChanged { section: String } }
```

Framing is a `u32` little-endian length prefix followed by JSON. JSON is chosen
over a compact binary format deliberately: the traffic volume is trivial, and
being able to read the wire in a log while debugging is worth more than the
bytes saved.

### Versioning

Every connection begins with `Hello`, and the broker answers with the protocol
version it speaks. A client that receives a version it does not understand
disconnects and disables cross-app features — it does not guess.

Bump `PROTOCOL_VERSION` in `slate-ipc` for any breaking change to the message
shapes, and record it in a changeset as a `major`.

## Rules

1. An app never talks to another app directly. Everything goes through the
   broker, so there is one place to audit, log, and version.
2. The broker moves messages. It contains no domain logic and makes no
   decisions about what an app should do.
3. Every payload type crossing either channel is declared in `@slate/bindings`
   and kept in step with its Rust counterpart.
4. A broker message is untrusted input. Validate it exactly as strictly as a
   command arriving from the webview.
