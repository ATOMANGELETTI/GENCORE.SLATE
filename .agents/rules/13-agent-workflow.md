---
id: 13-agent-workflow
title: Agent workflow
description: How an AI assistant should approach work in this repository — what to read first, what to verify, and what to never do.
globs: ['**/*']
alwaysApply: true
---

# Agent workflow

## Before writing code

1. Read the rule that governs the area you are touching. They are short and
   specific for exactly this reason.
2. Look at how the neighbouring code already does it. Consistency with the
   surrounding module beats a better idea imported from elsewhere.
3. Check `.agents/architecture/module-map.md` to find where something belongs
   before creating a new file.
4. If a decision seems questionable, check `.agents/architecture/adr/` — it may
   already have been made deliberately, with reasons.

## While writing code

- Put the file in the right folder with the right name **first**. Moving files
  later churns imports and history.
- Use the existing abstraction. `slate-paths` for paths, `@slate/ui-kit` for
  UI, `@slate/tokens` for values, `slate-ipc` for cross-app messaging. Adding a
  parallel way to do something that already has one is the most common failure
  mode in this repository.
- Write the test in `tests/`, at the mirrored path, as you go.

## Before saying you are done

Run it. Not "this should work" — run it:

```bash
bun run check
```

If the change touches paths, packaging, or process spawning, also verify
portability per `.agents/rules/09-portability.md`. If it touches the UI, look
at it in both themes.

Report what actually happened. If a test fails, say so and show the output. If
part of the task was skipped, say which part and why. A confident summary of
work that was not verified is worse than no summary.

## Never

- Edit a file with a `DO NOT EDIT` banner. Edit `.agents/` and run
  `bun run agents:sync`.
- Introduce npm, pnpm, yarn, or Node.js.
- Put a test beside the code it tests.
- Hard-code a colour, spacing value, or duration outside `@slate/tokens`.
- Resolve a path from anything other than `slate-paths`.
- Add a Tauri permission wider than the feature needs.
- Bump a version number by hand.
- Silence a lint with an allow attribute instead of fixing the cause.

## When blocked

Say so, and say precisely where. A wrong guess that compiles is far more
expensive than a question — especially in the portability and IPC layers, where
a mistake is invisible until a user's machine behaves differently from the
developer's.
