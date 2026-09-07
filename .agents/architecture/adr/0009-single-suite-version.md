# ADR 0009 — One version for the whole suite, driven by Changesets

**Status:** Accepted · **Date:** 2026-09-06

## Context

The repository holds three applications, nine TypeScript packages, and thirteen
Rust crates. But the **product** is one zip file that a user downloads. When
they report a problem, they can tell us one number.

Independent per-package versions would give precise changelogs and a version
number on the zip that means nothing.

## Decision

The suite has a single version. Changesets is the source of truth, with every
package in one `fixed` group, and `scripts/bun-version.ts` mirrors the result
outward:

```
.changeset/*.md
  → changeset version        package.json files, CHANGELOG.md
  → bun-version.ts           Cargo.toml [workspace.package] version
                             tauri/*/src-tauri/tauri.conf.json version
```

Nothing is published to a registry; `privatePackages.version` is `true` and
`tag` is `false`.

## Consequences

**Good**

- "SLATE 0.4.2" identifies an exact build of every component.
- A user's bug report is unambiguous.
- One changelog describes the release as a whole.
- The propagation is automated, so the numbers cannot silently disagree.

**Bad**

- A patch to one crate bumps everything. For a single distributed artefact this
  is honest rather than noisy: the zip did change.
- Changesets is a JavaScript tool now governing Rust versions. The coupling
  lives in exactly one script, which is tested and run in CI.

## Enforcement

`scripts/bun-version.ts --check` fails when any version field disagrees with
the root `package.json`, and CI runs it on every pull request. Hand-editing a
version is therefore caught immediately.
