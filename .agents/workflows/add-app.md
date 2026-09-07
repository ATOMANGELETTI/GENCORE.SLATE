# Workflow — adding an application

A new application is a substantial addition: another binary in the zip, another
entry in the Launcher, another surface to secure. Confirm it should be its own
app rather than a view inside an existing one before starting.

## 1. Generate it

```bash
moon generate tauri-app --defaults -- --name slate-<name>
```

The template in `.moon/templates/tauri-app/` produces the full structure —
frontend, `src-tauri`, capabilities, tests, and `moon.yml` — already wired to
`@slate/ui-kit` and `slate-runtime`. Do not copy an existing app by hand; the
template is what keeps the three apps identical where they should be.

## 2. Create its core crate

Domain logic lives in `crates/<name>-core`, not in `src-tauri`. The Tauri layer
should be a thin shell over a library that can be tested without a window.

Add the crate to the root `Cargo.toml` `[workspace.dependencies]`.

## 3. Wire it into the suite

| File                                | Change                                        |
| ----------------------------------- | --------------------------------------------- |
| `scripts/lib/install-layout.ts`     | Add the app to the portable tree              |
| `crates/launcher-core`              | Register it with the native app provider      |
| `commitlint.config.ts`              | Add its commit scope                          |
| `tsconfig.json`                     | Add the project reference (or `moon sync projects`) |
| `package.json`                      | Add a `dev:<name>` script                     |
| `.github/workflows/ci.yml`          | Add it to the build matrix if one is used     |

## 4. Capabilities

Start from nothing and add only what a feature needs, with a comment naming the
feature. Never begin by copying another app's capability file — permissions
that are convenient today become a security finding later.

## 5. Verify

```bash
moon run slate-<name>:build
bun run dev:<name>          # window opens, chrome correct in both themes
bun run package             # appears in the portable tree
```

## 6. Commit

```
feat(<name>): add slate-<name> application
```
