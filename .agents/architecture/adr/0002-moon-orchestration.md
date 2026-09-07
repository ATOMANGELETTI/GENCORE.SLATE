# ADR 0002 — Moon orchestrates; Cargo owns the crate graph

**Status:** Accepted · **Date:** 2026-09-06

## Context

The repository holds two build systems: Bun workspaces for TypeScript and Cargo
for Rust. Something has to sit above them so that `bun run check` means one
thing, caches correctly, and understands what a change actually affects.

The open question was how much of the Rust workspace to model in Moon. Moon can
treat every crate as a project, giving per-crate task graphs and caching.

## Decision

Moon orchestrates, with projects for `packages/*`, `tauri/*`, and the
repository root.

**The thirteen Rust crates are deliberately not Moon projects.** Cargo already
models that graph precisely, parallelises it, and caches it — and it is the
only thing that can, because it understands feature unification and the
workspace lockfile. Duplicating it in Moon would mean thirteen extra config
files describing a graph Cargo re-derives anyway, guaranteed to drift the first
time a dependency changes.

Workspace-wide Rust tasks (`lint:rust`, `test:rust`, `build:rust`) therefore
live on the root Moon project and shell out to Cargo.

## Consequences

**Good**

- The project graph stays small enough to hold in your head.
- Each build system does the part it is genuinely best at.
- `moon ci` still runs only what a diff affects, because the Tauri app projects
  declare their Rust sources as inputs.

**Bad**

- Rust task caching is Cargo's, not Moon's, so Moon's remote-cache story does
  not extend to the crates. Acceptable: Cargo's incremental cache is good, and
  the Rust link step dominates regardless.
- A crate-level change invalidates the whole Rust task rather than one project.
