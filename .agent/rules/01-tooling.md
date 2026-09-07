---
title: Tooling — Bun only
description: The toolchain. Bun is the only JavaScript runtime and package manager; Moon orchestrates; Cargo builds Rust.
globs: **/package.json,**/*.ts,**/*.tsx,scripts/**/*,**/moon.yml
alwaysOn: true
---

<!--
  GENERATED FILE — DO NOT EDIT.

  Source: .agents/rules/
  Regenerate: bun run agents:sync

  Edits here are overwritten by the next sync and rejected by CI
  (`bun run agents:check`). Change the rule in .agents/ instead.
-->

# Tooling

## Bun is the only JavaScript runtime and package manager

There is no Node.js in this project. Not as a runtime, not as a package
manager, not in CI, not "just for this one script".

| Instead of               | Use                            |
| ------------------------ | ------------------------------ |
| `npm install` / `pnpm i` | `bun install`                  |
| `npx <tool>`             | `bunx <tool>`                  |
| `node script.js`         | `bun run script.ts`            |
| `jest` / `vitest`        | `bun test`                     |
| `dotenv`                 | Bun loads `.env` automatically |
| `fs.promises.readFile`   | `Bun.file(path).text()`        |
| `child_process.exec`     | Bun's `$` shell tag            |
| the `glob` package       | `new Bun.Glob(pattern)`        |

Scripts are TypeScript, executed directly by Bun. No build step, no
transpilation, no `ts-node` equivalent.

If `package-lock.json`, `pnpm-lock.yaml`, or `yarn.lock` appears, a foreign
package manager was used: delete the file, delete `node_modules`, and rerun
`bun install`. Those filenames are in `.gitignore` precisely so the mistake
cannot be committed.

## Versions

Always the newest stable release. When adding a dependency, look the version up
rather than recalling one:

```bash
bun info <package> version      # npm
cargo search <crate> --limit 1  # crates.io
```

Versions are pinned exactly — `bunfig.toml` sets `exact = true`. Ranges let two
machines resolve different trees from the same manifest, which is exactly the
bug class a monorepo must not have.

## The toolchain

| Tool    | Role                                       | Config                              |
| ------- | ------------------------------------------ | ----------------------------------- |
| Bun     | Runtime, package manager, test runner      | `bunfig.toml`                       |
| Moon    | Task orchestration, caching, project graph | `.moon/`                            |
| Cargo   | Rust build and test                        | `Cargo.toml`, `.cargo/config.toml`  |
| Biome   | Format and lint for TS/JS/JSON/CSS         | `biome.json`                        |
| rustfmt | Format for Rust                            | `rustfmt.toml`                      |
| Clippy  | Lint for Rust                              | `clippy.toml`                       |
| Vite    | Frontend dev server and bundler            | `tauri/*/vite.config.ts`            |
| Tauri   | Desktop shell                              | `tauri/*/src-tauri/tauri.conf.json` |

## Running things

Prefer Moon over calling tools directly — it caches, and it understands the
dependency graph:

```bash
bun run check                 # lint + typecheck + test + build, everything
moon run slate-launcher:dev   # one task in one project
moon run :build               # the build task in every project
bun run dev:launcher          # convenience wrapper around the above
```
