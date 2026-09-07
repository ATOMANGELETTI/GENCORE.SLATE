---
title: Testing
description: Where tests live, what they cover, and the crate-design consequence of keeping Rust tests out of source files.
globs: **/tests/**/*,**/*.test.ts,**/*.test.tsx,**/*.e2e.ts
alwaysOn: true
---

<!--
  GENERATED FILE — DO NOT EDIT.

  Source: .agents/rules/
  Regenerate: bun run agents:sync

  Edits here are overwritten by the next sync and rejected by CI
  (`bun run agents:check`). Change the rule in .agents/ instead.
-->

# Testing

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
