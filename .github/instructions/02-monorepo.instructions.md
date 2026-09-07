---
applyTo: '**/moon.yml,.moon/**/*,**/package.json,Cargo.toml'
description: How the workspace is organised, how projects depend on each other, and how tasks are defined.
---

<!--
  GENERATED FILE — DO NOT EDIT.

  Source: .agents/rules/
  Regenerate: bun run agents:sync

  Edits here are overwritten by the next sync and rejected by CI
  (`bun run agents:check`). Change the rule in .agents/ instead.
-->

# Monorepo and Moon

## Two workspaces, one repository

- **Bun workspaces** own `packages/*` and `tauri/*` (declared in the root
  `package.json`).
- **The Cargo workspace** owns `crates/*` and `tauri/*/src-tauri` (declared in
  the root `Cargo.toml`).

Moon sits above both and orchestrates tasks.

## Which things are Moon projects

Moon projects are `packages/*`, `tauri/*`, and the repository root.

**The Rust crates are deliberately not Moon projects.** Cargo already models
that graph exactly, builds it in parallel, and caches it. Mirroring thirteen
crates into Moon would add thirteen config files that drift and buy nothing.
Workspace-wide Rust tasks (`lint:rust`, `test:rust`, `build:rust`) live on the
root project instead.

## Dependency direction

Dependencies flow in one direction only. A cycle is a design error, not
something to work around.

```
tauri/*  ──▶  packages/*  ──▶  (nothing)
tauri/*/src-tauri  ──▶  crates/*  ──▶  crates/slate-core
```

Applications never import from each other. Anything two apps need belongs in a
crate or a package.

## Task definitions live in each project

Every project declares its own tasks in its `moon.yml`. There is no
`.moon/tasks/` directory, and that is deliberate rather than an oversight:
Moon 2.5 applies **every** file in `.moon/tasks/` to **every** project
regardless of its name, so the documented `tag-<tag>.yml` scoping does not
work — Tauri tasks landed on library projects and on the repository root.
Depending on a mechanism that does not behave as advertised is worse than a
little repetition.

The repetition is bounded and generated:

- Library projects share three tasks: `typecheck`, `test`, `build`.
- Applications share six: `dev`, `dev-web`, `build-web`, `build`, `typecheck`,
  `test`.
- New applications come from `moon generate tauri-app`, so the copies stay
  identical without being hand-maintained.

Two details that bite:

- **Commands go through `bunx`.** Moon runs tasks via proto shims, so binaries
  in `node_modules/.bin` are not on `PATH`; `tsc` and `biome` are not found
  without it.
- **Test tasks run from the workspace root** (`runFromWorkspaceRoot: true`),
  because the DOM preload in `bunfig.toml` is declared relative to that root.

## Adding a project

1. Create the directory under `packages/` or `tauri/`.
2. Add `moon.yml` with an `id`, a `layer`, `dependsOn`, and its tasks — copy
   the task block from a sibling of the same kind.
3. Add `package.json` with the `@slate/` name and its workspace dependencies.
4. Add `tsconfig.json` with its **own** `outDir` and `tsBuildInfoFile`.
   Inheriting them from the shared base makes every project write build info to
   the same path, and TypeScript refuses.
5. Run `moon sync projects` to generate the project references.

Never hand-edit the `references` or `paths` in a `tsconfig.json`; Moon owns
them, which is also why Biome does not format those files.

## Useful commands

```bash
moon check --all             # everything, respecting the cache
moon run :build              # one task across all projects
moon project slate-ui-kit    # inspect a project's resolved config
moon project-graph           # visualise the graph in a browser
moon query tasks             # machine-readable task list
```
