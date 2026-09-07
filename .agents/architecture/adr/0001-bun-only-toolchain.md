# ADR 0001 — Bun is the only JavaScript runtime and package manager

**Status:** Accepted · **Date:** 2026-09-06

## Context

A monorepo with several TypeScript packages, three application frontends, and a
set of automation scripts needs a runtime, a package manager, a test runner, and
a script executor. The conventional answer is Node plus npm or pnpm plus Vitest
plus `tsx` — four tools, four configuration surfaces, and a lockfile that must
not disagree with any of them.

## Decision

Bun provides all four, and is the **only** JavaScript toolchain permitted in
this repository. No Node.js, npm, pnpm, or Yarn — as a runtime, as a package
manager, in a script, or in CI.

Automation scripts are TypeScript executed directly by Bun. Tests run under
`bun test`. Workspaces are Bun workspaces. The lockfile is `bun.lock`.

## Consequences

**Good**

- One tool, one lockfile, one configuration file, no cross-tool version skew.
- Scripts run TypeScript with no transpilation step.
- `Bun.file`, `Bun.Glob`, `Bun.$`, and `bun:test` remove several dependencies
  outright, which matters for a project that audits its supply chain.
- Installs and test runs are markedly faster, which compounds across a monorepo.

**Bad**

- Any tool that assumes a Node runtime must be checked before adoption. In
  practice `bunx` handles nearly all of them.
- Contributors must have Bun installed; `.tool-versions` pins the version.

## Enforcement

`package-lock.json`, `pnpm-lock.yaml`, and `yarn.lock` are listed in
`.gitignore` specifically so that using a foreign package manager cannot be
committed by accident. The rule is stated in `.agents/rules/01-tooling.md`.
