---
title: Naming and file structure
description: The modular folder and file naming system used across TypeScript and Rust. Read this before creating any file.
globs: **/*
alwaysOn: true
---

<!--
  GENERATED FILE — DO NOT EDIT.

  Source: .agents/rules/
  Regenerate: bun run agents:sync

  Edits here are overwritten by the next sync and rejected by CI
  (`bun run agents:check`). Change the rule in .agents/ instead.
-->

# Naming and file structure

The goal is that a file's path tells you what it is before you open it, and
that every folder holds exactly one kind of thing.

## Folders

Folders are `kebab-case` and named for a **concern**, not a layer of
abstraction:

```
src/context-menu/     src/commands/     src/layout/
src/state/            src/hooks/        src/events/
```

`utils/`, `helpers/`, `misc/`, and `common/` are banned. They are where code
goes to become unfindable. If something is genuinely shared, it belongs in
`packages/slate-utils` with a name that says what it does.

## TypeScript files: `<subject>.<role>.<ext>`

The subject comes first so that related files sort together:

```
titlebar.context-menu.ts       tray.context-menu.ts
window.commands.ts             session.commands.ts
settings.store.ts              window.store.ts
use-window-state.hook.ts       use-theme.hook.ts
button.component.tsx           button.variants.ts        button.types.ts
paths.service.ts               format-bytes.util.ts
```

Recognised roles: `component`, `hook`, `store`, `service`, `commands`,
`events`, `context-menu`, `menu`, `layout`, `provider`, `types`, `variants`,
`util`, `config`, `constants`, `schema`, `test`.

Every folder that exports outward has an `index.ts` that re-exports its public
surface. Import from the folder, not from a file inside it.

## Rust files: the folder carries the role

**Rust cannot use the TypeScript convention.** A module name must be a valid
identifier, and `window.commands.rs` is not — `mod window.commands;` will not
compile. So Rust inverts the pattern: the folder is the role, the file is the
subject.

```
src/commands/window.rs      ← not window.commands.rs
src/commands/session.rs
src/commands/mod.rs         ← re-exports the folder's public surface
src/menu/tray.rs
src/setup/logging.rs
src/state/app.rs
```

Same modular intent, expressed the way each language allows. Do not attempt to
force dots into Rust filenames.

## Tests

Tests live in `tests/`, never beside the source. This applies to both
languages — see `.agents/rules/10-testing.md` for the full rule and its
consequences.

The test path mirrors the source path:

```
src/context-menu/titlebar.context-menu.ts
tests/unit/context-menu/titlebar.context-menu.test.ts
```

## Naming inside code

| Kind                       | Convention                     | Example                        |
| -------------------------- | ------------------------------ | ------------------------------ |
| TypeScript type, component | `PascalCase`                   | `TitleBarProps`, `StatusBar`   |
| TypeScript value, function | `camelCase`                    | `resolveInstallDir`            |
| TypeScript constant        | `SCREAMING_SNAKE_CASE`         | `DEFAULT_WINDOW_WIDTH`         |
| React hook                 | `use` prefix                   | `useWindowState`               |
| Rust type, trait           | `PascalCase`                   | `SlatePaths`, `AppProvider`    |
| Rust function, module      | `snake_case`                   | `resolve_install_dir`          |
| Tauri command              | `snake_case`, verb first       | `get_window_state`             |
| CSS custom property        | `--slate-<category>-<name>`    | `--slate-bg-surface`           |
| Crate                      | `slate-` prefix, or `*-core`   | `slate-paths`, `launcher-core` |
| npm package                | `@slate/<name>`                | `@slate/ui-kit`                |

Booleans read as assertions: `isVisible`, `hasFocus`, `canLaunch` — never
`visible`, `focus`, `launchable`.
