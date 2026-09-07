# Changesets

Every user-visible change needs a changeset. Create one with:

```bash
bun run changeset
```

Because the whole suite is a **fixed** version group, the bump you pick applies
to the entire product — Launcher, Terminal, Explorer, every package, and the
Cargo workspace. Choose the level that describes the release as a whole:

| Bump    | Use when                                                            |
| ------- | ------------------------------------------------------------------- |
| `patch` | Bug fixes, internal refactors, documentation                        |
| `minor` | New features, new components, new commands                          |
| `major` | Breaking IPC/config/database changes, or a changed `installDir` shape |

A release runs `bun run version`, which applies the changesets, regenerates
`CHANGELOG.md`, and then executes `scripts/bun-version.ts` to propagate the new
version into `Cargo.toml` and each `tauri.conf.json`. Never edit those version
fields by hand.
