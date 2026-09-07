# GENCORE.SLATE

A portable, Windows-only suite of desktop applications built with **Rust**,
**Tauri v2**, and **React**.

The whole product lives inside one directory that can be copied anywhere — a USB
stick, `D:\Tools`, a synced folder — and it writes nothing outside that
directory. No installer, no registry keys, no `%APPDATA%`. It ships as a zip.

| Application      | What it does                                                     |
| ---------------- | ---------------------------------------------------------------- |
| `slate-launcher` | Starts the suite's applications and installed portable apps       |
| `slate-terminal` | Terminal emulator — currently a template, the PTY backend is next |
| `slate-explorer` | File manager, scoped to the portable `storage/` tree              |

## Requirements

- Windows 10 1809 or later
- [Bun](https://bun.sh) 1.4.2+ — the only JavaScript runtime and package manager
- [Rust](https://rustup.rs) — the version in `rust-toolchain.toml` installs itself
- [moon](https://moonrepo.dev) 2.5+

```bash
bun install
```

## Working on it

```bash
bun run dev:launcher     # run an application, with a development portable root
bun run dev:terminal
bun run dev:explorer

bun run gallery          # every UI kit component, in both themes, in a browser
bun run check            # lint, typecheck, test, build — the whole suite
bun run package          # build the portable zip
```

`bun run dev:*` creates `installDir/` in the repository and points the
application at it, so development uses the same layout that ships.

## Repository layout

```
crates/      Rust libraries shared by every application
packages/    TypeScript libraries — design tokens, UI kit, IPC client
tauri/       The three applications (frontend + src-tauri backend)
installDir/  The portable layout: exactly what ships inside the zip
scripts/     Bun automation — dev, packaging, versioning, agent docs
.agents/     The source of truth for contributor and AI-assistant guidance
```

## The rules that matter

Six invariants hold this project together. Breaking one is a defect, not a
style disagreement:

1. **Bun only.** No Node.js, npm, pnpm, or Yarn — anywhere, including CI.
2. **Nothing is written outside the portable root.** Every path comes from
   `slate-paths`.
3. **Tests live in `tests/` directories**, never beside the code they test, in
   either language.
4. **One version for the whole suite**, written by tooling and never by hand.
5. **The UI is built from `@slate/ui-kit`.** Applications do not invent their
   own buttons, dialogs, or colours.
6. **Generated files are never edited.** Change the source and regenerate.

The full set lives in [`.agents/rules/`](.agents/rules/), and the reasoning
behind each significant decision is recorded in
[`.agents/architecture/adr/`](.agents/architecture/adr/).

## Documentation

| Topic                    | Where                                                                |
| ------------------------ | -------------------------------------------------------------------- |
| Contributor and AI rules | [`.agents/rules/`](.agents/rules/)                                    |
| What depends on what     | [`.agents/architecture/module-map.md`](.agents/architecture/module-map.md) |
| The portable layout      | [`.agents/architecture/install-layout.md`](.agents/architecture/install-layout.md) |
| How applications talk    | [`.agents/architecture/ipc-protocol.md`](.agents/architecture/ipc-protocol.md) |
| Decisions and why        | [`.agents/architecture/adr/`](.agents/architecture/adr/)               |
| Common procedures        | [`.agents/workflows/`](.agents/workflows/)                             |
| The WebView2 runtime     | [`docs/webview2.md`](docs/webview2.md)                                 |

`AGENTS.md`, `CLAUDE.md`, `.cursor/`, `.agent/`, and `.github/instructions/` are
**generated** from `.agents/` by `bun run agents:sync`. Editing them directly is
always a mistake — CI rejects the drift.

## Releasing

```bash
bun run changeset     # describe the change
bun run version       # apply it and propagate the version everywhere
git tag v0.2.0 && git push --tags
```

The tag builds the suite and publishes `SLATE-<version>-win-x64.zip` with a
SHA-256 checksum and SBOMs. See [`.agents/workflows/release.md`](.agents/workflows/release.md).

Note that release builds require the fixed-version WebView2 runtime, which
Microsoft does not publish at a stable URL — see [`docs/webview2.md`](docs/webview2.md)
for the one-time setup.

## Licence

Proprietary. All rights reserved. See [LICENSE](LICENSE).
