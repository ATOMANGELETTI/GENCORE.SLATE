---
applyTo: 'tauri/**/*,crates/slate-runtime/**/*,crates/slate-ipc/**/*'
description: Capabilities, content security policy, IPC command design, and the project's known security limitations.
---

<!--
  GENERATED FILE — DO NOT EDIT.

  Source: .agents/rules/
  Regenerate: bun run agents:sync

  Edits here are overwritten by the next sync and rejected by CI
  (`bun run agents:check`). Change the rule in .agents/ instead.
-->

# Tauri and security

The threat model is straightforward: the webview renders only local assets, but
it also renders **file names, app metadata, and command output the user did not
write**. Treat everything crossing into the webview as untrusted content, and
everything crossing out of it as an untrusted request.

## Capabilities

Each app declares its own capabilities in `src-tauri/capabilities/*.json`, and
each grants the **least** it can:

- A permission is added because a specific feature needs it, and the JSON
  carries a comment saying which.
- `slate-terminal` has **no** shell or process permission. Its backend is
  stubbed; granting execution now would be granting it to nothing.
- `slate-explorer`'s filesystem scope is restricted to the portable
  `storage/**` tree. It cannot read `C:\Users`, and that is the point.
- Never use a wildcard permission such as `fs:default` or `shell:allow-execute`
  to make an error go away. Find the specific permission.

## Content security policy

Defined in each `tauri.conf.json` and deliberately strict:

```
default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' asset: data:;
font-src 'self'; connect-src 'self' ipc: http://ipc.localhost; object-src 'none';
frame-src 'none'; base-uri 'none'
```

No remote origin is ever added. Fonts, icons, and styles are bundled — a
portable app must work with the network cable unplugged.

Also set on every app: `withGlobalTauri: false` (no `window.__TAURI__` for a
compromised script to find) and `freezePrototype: true`.

## Command design

Tauri commands are the trust boundary. Every one of them:

1. Takes typed parameters — never a free-form `serde_json::Value`.
2. Validates its input before acting. A path argument is resolved through
   `slate-paths` and rejected if it escapes the root; an id is checked against
   the registry before use.
3. Returns `Result<T, SlateError>` so the frontend sees a typed failure rather
   than a stringified panic.
4. Is named `snake_case`, verb first: `get_window_state`, `launch_app`.
5. Is registered in one `invoke_handler`, in `src-tauri/src/commands/mod.rs`.

Never accept a raw path string from the frontend and pass it to the filesystem.
That is the whole attack.

## Rendering untrusted content

File names, app titles, and metadata come from disk and can contain anything.
React escapes by default — keep it that way. `dangerouslySetInnerHTML` is
banned outright; there is no case in this product that needs it.

## Secrets

None are committed. `.env.local` is git-ignored, `.env.example` documents shape
only. A portable app has nowhere safe to store a secret, so it does not try:
anything sensitive belongs in the Windows credential store via an explicit,
reviewed integration — not in a config file inside the zip.

## Known limitations

Documented rather than hidden:

- **The zip is unsigned.** SmartScreen will warn on first run until code
  signing is set up (Azure Trusted Signing is the intended route). Do not
  attempt to work around the warning; users are told what to expect.
- **The suite trusts its own `installDir`.** Anyone able to write into the
  portable root can replace an executable. This is inherent to portable
  software and matches how PortableApps.com behaves.
