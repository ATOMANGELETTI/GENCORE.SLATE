# Testing & Quality Assurance Guide

GENCORE.SLATE enforces a disciplined testing philosophy: tests prove observable behavior,
operate against isolated test fixtures, and never pollute the host operating system.

---

## 1. The Core Rule: Tests Live in `tests/`

No test file is ever placed beside the code it tests. Inline `#[cfg(test)] mod tests` blocks
in Rust and collocated `__tests__/` folders in TypeScript are strictly forbidden.

```
Source File                                                      Mirrored Test File
────────────────────────────────────────────────────────────────────────────────────────────────────────────
packages/slate-ui-kit/src/button/button.component.tsx      ──▶   packages/slate-ui-kit/tests/button/button.component.test.tsx
crates/slate-paths/src/discover.rs                        ──▶   crates/slate-paths/tests/discover.rs
tauri/slate-launcher/src/state/window.store.ts             ──▶   tauri/slate-launcher/tests/unit/state/window.store.test.ts
```

### The Architectural Consequence for Rust
In Rust, tests residing in the `tests/` directory compile as external integration crates.
They can only access the target crate's **public API**.

> [!NOTE]
> This is a deliberate design constraint. If internal crate logic cannot be tested through
> its public API, it indicates that the logic should be factored into a well-defined public
> module or sub-crate. Do not bypass this rule with inline test modules.

---

## 2. Test Isolation & Mocks

Tests must never touch the real host filesystem, access the Windows Registry, or make network calls.

### Rust Test Fixtures (`slate-testing`)
Rust integration tests use the `slate-testing` crate to build an isolated, temporary
portable directory structure on demand:

```rust
use slate_testing::TestPortableRoot;

#[test]
fn rejects_paths_escaping_the_root() {
    let fixture = TestPortableRoot::create().expect("failed to init test root");
    let paths = fixture.paths();

    // Verify behavior against the isolated test directory
    assert!(paths.resolve_within(paths.storage_dir(), "../../Windows").is_err());
}
```

### TypeScript Test Fixtures (`@slate/testing`)
Frontend unit tests execute in Bun with `@slate/testing` providing mock window bounds,
Tauri event emitters, and DOM environments without opening desktop windows.

---

## 3. Test Layers & Responsibilities

| Layer | Primary Focus | Tools | Command |
| --- | --- | --- | --- |
| **Path Resolution** | Discovery precedence, boundary escapes | Rust Nextest | `cargo test-all -p slate-paths` |
| **Config & DB** | TOML parsing, SQLite schema migrations | Rust Nextest | `cargo test-all -p slate-config -p slate-db` |
| **IPC Protocols** | Framing, serialize/deserialize, version mismatch | Rust Nextest | `cargo test-all -p slate-ipc` |
| **UI Components** | Accessible names, keyboard navigation, variants | Bun Test | `bun test packages/slate-ui-kit` |
| **Frontend Stores** | State transitions, active app tracking | Bun Test | `bun test tauri/slate-launcher` |
| **End-to-End** | Window launches, renders, handles input, quits | WebDriver | `bun run test:e2e` |

---

## 4. Running Tests

```powershell
# Run all tests across the entire monorepo (TypeScript + Rust)
bun run test

# Run TypeScript tests only (Bun test runner)
bun run test:ts

# Run Rust tests only (Nextest parallel runner)
bun run test:rust

# Run end-to-end WebDriver smoke tests
bun run test:e2e

# Generate Rust code coverage report (lcov.info)
bun run coverage
```

### End-to-End Testing Nuances
End-to-end tests launch compiled binaries via Microsoft Edge WebDriver (`msedgedriver`).
Because debug builds do not embed their web frontends, **e2e tests require release binaries**:
```powershell
bun run package
bun run test:e2e
```

---

## 5. Test-Driven Bug Fixes

Every bug fix in this repository must begin with a failing test reproducing the defect:
1. Write a test in `tests/` that isolates the failure.
2. Verify that the test fails as expected.
3. Apply the minimal implementation fix.
4. Verify that the test passes and no regressions were introduced across the suite.

