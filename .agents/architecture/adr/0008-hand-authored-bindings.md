# ADR 0008 — Hand-authored IPC bindings instead of tauri-specta

**Status:** Accepted · **Date:** 2026-09-06

## Context

Types cross the boundary between Rust and TypeScript constantly: command
arguments, return values, event payloads. When the two sides drift, nothing
fails to compile — the frontend simply reads `undefined` at runtime, which is
among the hardest bugs in this codebase to trace.

The standard answer for Tauri v2 is **tauri-specta**: annotate Rust types with
`specta::Type`, and generate the TypeScript automatically.

## Decision

For now, the IPC contract is **hand-authored** in `@slate/bindings`, with a
Rust-side test asserting that every registered command appears in the contract.

The reason is version maturity. At the time of writing, `tauri-specta` and
`specta` are both at `2.0.0-rc.x`. Putting a release candidate at the base of
the dependency graph — where every app and every crate depends on it — means
inheriting its breaking changes across the entire suite, in the foundation
layer, before any product exists to justify the cost.

The contract is small (a handful of window and app-descriptor types), so
maintaining it by hand is cheap today.

## Consequences

**Good**

- No release-candidate dependency in the foundation.
- The generated-code build step disappears; `bun run check` gets simpler.
- The contract is readable in one file, which makes review easy.

**Bad**

- Drift is possible. Mitigated by two things: every payload type is declared
  **only** in `@slate/bindings` and imported everywhere else, and a Rust test
  fails if a command is registered without a matching contract entry.
- The mitigation is weaker than a compiler. This is the real cost, and it is
  accepted knowingly.

## Revisit when

`tauri-specta` reaches a stable `2.x`, **or** the contract grows past roughly
twenty types — whichever comes first. At that point generation is clearly worth
its cost, and this ADR should be superseded rather than quietly ignored.
