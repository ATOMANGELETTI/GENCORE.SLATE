---
applyTo: '**/*'
description: What GENCORE.SLATE is, how it is laid out, and the invariants that must never be broken.
---

<!--
  GENERATED FILE — DO NOT EDIT.

  Source: .agents/rules/
  Regenerate: bun run agents:sync

  Edits here are overwritten by the next sync and rejected by CI
  (`bun run agents:check`). Change the rule in .agents/ instead.
-->

# GENCORE.SLATE

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
