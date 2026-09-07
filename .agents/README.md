# `.agents/` — the single source of truth for AI assistant guidance

Four different tools read project instructions from four different places.
Keeping four copies in sync by hand fails within a week. So this directory is
the **only** place guidance is written, and `scripts/sync-agents.ts` generates
every tool-specific file from it.

## What generates what

| Generated target                         | Consumed by                                                                    |
| ---------------------------------------- | ------------------------------------------------------------------------------ |
| `AGENTS.md`                              | The cross-tool standard — read by Cursor, Copilot, Antigravity, and Claude Code |
| `CLAUDE.md`                              | Claude Code                                                                     |
| `.cursor/rules/*.mdc`                    | Cursor (per-rule `globs`)                                                       |
| `.github/copilot-instructions.md`        | GitHub Copilot (repository-wide)                                                |
| `.github/instructions/*.instructions.md` | GitHub Copilot (per-path `applyTo`)                                             |
| `.agent/rules/*.md`                      | Antigravity                                                                     |

Every generated file carries a `DO NOT EDIT` banner. **Editing one is always a
mistake** — the next `bun run agents:sync` overwrites it, and CI fails first
anyway via `bun run agents:check`.

## Layout

```
.agents/
├── rules/          Numbered, single-topic rules. The substance.
├── architecture/   How the system is built; ADRs recording why.
├── workflows/      Step-by-step procedures for recurring tasks.
└── templates/      Shared assets (project dictionary, doc templates).
```

## Writing a rule

Each file in `rules/` is Markdown with YAML frontmatter:

```yaml
---
id: 07-rust
title: Rust
description: Conventions for every crate in the workspace.
globs: ['crates/**/*.rs', 'tauri/*/src-tauri/**/*.rs']
alwaysApply: false
---
```

- `globs` — which files the rule governs. Cursor and Copilot use this to load
  the rule only when relevant; it is the difference between useful context and
  wasted context.
- `alwaysApply: true` — the rule is fundamental enough to load for every task.
  Keep this set on as few rules as possible.

Rules must be **specific and checkable**. "Write clean code" helps nobody.
"Tests live in `tests/`, never beside source" can be followed and verified.

## After editing

```bash
bun run agents:sync
```

Then commit the generated files alongside your change.
