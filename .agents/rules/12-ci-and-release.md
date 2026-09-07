---
id: 12-ci-and-release
title: CI and release
description: What runs in continuous integration, how the single suite version is propagated, and how a release is cut.
globs: ['.github/**/*', 'scripts/**/*', '.changeset/**/*']
alwaysApply: false
---

# CI and release

## Continuous integration

Every pull request runs on `windows-latest` — the only platform this product
targets, so the only platform worth testing on:

| Job          | What it proves                                              |
| ------------ | ------------------------------------------------------------ |
| `lint`       | Biome, Clippy with `-D warnings`, rustfmt, spelling          |
| `typecheck`  | The TypeScript project graph builds                          |
| `test`       | Bun and Cargo test suites pass                               |
| `build`      | All three apps compile and bundle                            |
| `agents`     | Generated agent files match `.agents/` (`agents:check`)      |
| `deny`       | Licences, advisories, and dependency sources are acceptable  |

CI runs `moon ci`, which uses the project graph to run only what the diff
affects, then caches the rest.

## One version, propagated by tooling

The suite ships as a single product with a single version number. The chain is:

```
.changeset/*.md
   → bun run version
       → changeset version        (bumps package.json files, writes CHANGELOG.md)
       → scripts/bun-version.ts   (mirrors that version outward)
           → Cargo.toml [workspace.package] version
           → tauri/*/src-tauri/tauri.conf.json  version
```

**Never edit a version field by hand.** If the numbers disagree,
`scripts/bun-version.ts --check` will say so, and CI runs it.

## Cutting a release

1. Merge the Changesets release pull request into `main`.
2. Tag it: `git tag v0.2.0 && git push --tags`.
3. `release.yml` then builds, packages, and publishes.

The release workflow produces:

- `SLATE-<version>-win-x64.zip` — the complete portable suite
- `SLATE-<version>-win-x64.zip.sha256` — checksum
- `sbom-cargo.cdx.json` and `sbom-bun.cdx.json` — CycloneDX SBOMs
- Release notes generated from the changesets

## Packaging

`bun run package` assembles the portable tree from the declarative layout in
`scripts/lib/install-layout.ts`, seeds default config, embeds the WebView2
runtime, writes `.slate-root`, zips it, and then verifies the result against
the same manifest that produced it.

The WebView2 fixed-version runtime is the one input that cannot be fetched
automatically — Microsoft publishes no stable direct URL for it. Release builds
fail loudly with instructions when it is absent rather than silently producing
a zip that is not portable. See `docs/webview2.md`.

## Scheduled work

| Workflow      | Cadence | Purpose                                        |
| ------------- | ------- | ---------------------------------------------- |
| `security.yml`| Daily   | Advisories, gitleaks, OSV, CodeQL              |
| `mutants.yml` | Weekly  | Mutation testing over the core crates          |
| Renovate      | Weekly  | Grouped dependency updates, security immediate |
