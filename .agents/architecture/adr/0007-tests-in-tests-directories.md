# ADR 0007 — All tests live in `tests/` directories, including Rust

**Status:** Accepted · **Date:** 2026-09-06

## Context

TypeScript projects vary in convention; Rust has a strong one. Idiomatic Rust
puts unit tests in a `#[cfg(test)] mod tests` block at the bottom of the file
they test, and reserves `tests/` for integration tests.

The requirement for this project is that source directories contain source, and
that every test for a thing is findable in one predictable place.

## Decision

Every test lives under a `tests/` directory, at a path mirroring the source it
covers. This applies to Rust as well: **no inline `#[cfg(test)]` modules.**

```
crates/slate-paths/src/discover.rs
crates/slate-paths/tests/discover.rs
```

## Consequences

**Good**

- Source files contain only source, and stay shorter.
- Finding a module's tests requires no searching.
- One rule for both languages, so it is easy to state and easy to check.

**Bad — and deliberate**

- Rust integration tests can only reach a crate's **public** API. Anything worth
  testing must therefore be public and documented.

  This is the interesting consequence, and it is the reason the decision is
  worth making rather than merely tolerable. It forces crates to expose a real,
  intentional API instead of accumulating private helpers tested through the
  back door. When a private function genuinely needs direct testing, that is
  strong evidence it wants to be its own public unit in its own module — which
  is usually the better design anyway.

- Compilation is marginally slower: each file in `tests/` is its own crate.
  Irrelevant at this scale.

## Enforcement

Stated in `.agents/rules/10-testing.md`. A reviewer seeing `#[cfg(test)]` in a
`src/` file should reject the change and ask for the test to be moved and the
API to be made public.
