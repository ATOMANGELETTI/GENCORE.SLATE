# Workflow — adding a Rust crate

Add a crate when a piece of logic is genuinely shared, or when a bounded
responsibility deserves its own tested API. Do not add one to hold "misc"
helpers — see `.agents/architecture/module-map.md` for where things belong.

## 1. Create it

```bash
moon generate rust-crate --defaults -- --name slate-<name>
```

Or by hand:

```
crates/slate-<name>/
├── Cargo.toml
├── src/
│   ├── lib.rs          //! crate-level docs: role and place in the graph
│   └── <role>/         folder = role, file = subject
└── tests/
    └── <subject>.rs
```

## 2. `Cargo.toml`

Inherit everything from the workspace. A version number in a member manifest is
how two crates end up on two versions of the same library.

```toml
[package]
name = "slate-<name>"
version.workspace = true
edition.workspace = true
rust-version.workspace = true
license.workspace = true
publish = false

[dependencies]
slate-core.workspace = true
thiserror.workspace = true

[dev-dependencies]
slate-testing.workspace = true

[lints]
workspace = true
```

## 3. Register it

Add it to `[workspace.dependencies]` in the root `Cargo.toml` with its path, so
other crates can depend on it by `slate-<name>.workspace = true`. Add its
commit scope to `commitlint.config.ts`.

## 4. Respect the dependency direction

Dependencies flow downward: everything may depend on `slate-core`; nothing
depends on an application. A cycle is a design error — if two crates need each
other, the shared part belongs in a third.

## 5. Write the API for testability

Tests live in `tests/` and can only reach the public API (ADR 0007). Decide
what is public deliberately, document every public item, and keep the rest
`pub(crate)`.

## 6. Verify

```bash
cargo test --package slate-<name>
cargo clippy --package slate-<name> --all-targets -- -D warnings
cargo doc --package slate-<name> --no-deps --open
```

## 7. Commit

```
feat(<name>): add slate-<name> crate
```
