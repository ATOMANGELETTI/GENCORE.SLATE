# Workflow — cutting a release

## Before you start

- `main` is green.
- Every change since the last release has a changeset.
- The WebView2 runtime is available locally or in CI secrets (see
  `docs/webview2.md`) — a release build fails without it.

## 1. Version

Changesets opens a release pull request automatically. To do it manually:

```bash
bun run version
```

This applies the changesets, writes `CHANGELOG.md`, and then runs
`scripts/bun-version.ts`, which mirrors the new version into the Cargo
workspace and every `tauri.conf.json`.

Review the diff. Every version field should show the same number. Do not edit
any of them by hand.

## 2. Merge and tag

```bash
git tag v<version>
git push origin main --tags
```

The tag triggers `.github/workflows/release.yml`.

## 3. What the workflow produces

| Artefact                              | Purpose                    |
| ------------------------------------- | -------------------------- |
| `SLATE-<version>-win-x64.zip`         | The portable suite         |
| `SLATE-<version>-win-x64.zip.sha256`  | Integrity check            |
| `sbom-cargo.cdx.json`                 | Rust dependency SBOM       |
| `sbom-bun.cdx.json`                   | JavaScript dependency SBOM |

## 4. Verify the artefact before announcing

Download the zip from the release — not the local build — and run the full
portability check in `.agents/workflows/debug-portability.md` against it. Then
confirm the checksum:

```powershell
(Get-FileHash .\SLATE-<version>-win-x64.zip -Algorithm SHA256).Hash.ToLower()
```

## 5. Note what users will see

The zip is unsigned, so SmartScreen warns on first run. The release notes
should say so plainly rather than leaving users to wonder. See
`.agents/rules/08-tauri-and-security.md`.

## If a release is wrong

Do not delete the tag or the release. Fix forward: land the fix, cut the next
patch version, and mark the bad release as broken in its notes. A deleted tag
that someone already downloaded is worse than a documented bad version.
