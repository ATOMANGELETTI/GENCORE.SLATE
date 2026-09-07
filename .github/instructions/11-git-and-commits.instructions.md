---
applyTo: '**/*'
description: Branch naming, Conventional Commits with an enforced scope list, and what a reviewable pull request looks like.
---

<!--
  GENERATED FILE — DO NOT EDIT.

  Source: .agents/rules/
  Regenerate: bun run agents:sync

  Edits here are overwritten by the next sync and rejected by CI
  (`bun run agents:check`). Change the rule in .agents/ instead.
-->

# Git, commits, and pull requests

## Branches

```
feat/launcher-app-grid
fix/paths-unc-discovery
chore/deps-tauri-2-12
docs/adr-broker-placement
```

`main` is protected. Work happens on a branch and arrives through a pull
request.

## Commits

Conventional Commits, enforced by commitlint in `.husky/commit-msg`:

```
<type>(<scope>): <subject>
```

The scope must come from the list in `commitlint.config.ts` — the apps
(`launcher`, `terminal`, `explorer`), the crates (`paths`, `ipc`, `db`, …), the
packages (`ui-kit`, `tokens`, …), or a cross-cutting area (`ci`, `deps`,
`release`, `agents`). A commit naming a scope that does not exist is almost
always a commit that touched the wrong project.

```
feat(launcher): add app grid with keyboard navigation
fix(paths): resolve portable root through UNC paths
security(tauri): tighten explorer filesystem scope to storage/
```

Subject in lower case, imperative mood, under 100 characters, no trailing
period. The body explains **why**; the diff already shows what.

One logical change per commit. A formatting sweep and a behaviour change never
share a commit — and a formatting-only commit gets its SHA added to
`.git-blame-ignore-revs`.

## Changesets

Any user-visible change needs one:

```bash
bun run changeset
```

Because the suite is a fixed version group, the bump you choose applies to the
whole product. Skip the changeset only for changes with no user-facing effect
at all (CI tweaks, internal docs).

## Pull requests

- Title follows the same Conventional Commit format.
- The description says what changed, why, and how it was verified.
- Screenshots for anything visual, in **both** themes.
- Green CI, including `agents:check`.
- Generated files are committed alongside the source that produced them.

Before opening one:

```bash
bun run check
bun run agents:sync
```

## Never commit

Secrets, `.env.local`, build output, `node_modules`, a foreign lockfile, or an
edit to a file carrying a `DO NOT EDIT` banner.
