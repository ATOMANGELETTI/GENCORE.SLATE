# Release & Versioning Workflow

GENCORE.SLATE ships as a unified product with a single version number (ADR 0009).
This document describes the end-to-end release lifecycle, from creating semantic changesets
to building and verifying portable release artifacts.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                           RELEASE & VERSIONING LIFECYCLE                         │
│                                                                                  │
│   1. Contributor               2. Release Preparation       3. CI Publication    │
│   ┌────────────────────┐       ┌────────────────────┐       ┌──────────────────┐ │
│   │ bun run changeset  │ ────▶ │ bun run version    │ ────▶ │ GitHub Actions   │ │
│   │ Document feature   │       │ Updates versions   │       │ release.yml      │ │
│   │ or bugfix in PR    │       │ and CHANGELOG.md   │       │ Packages Zip     │ │
│   └────────────────────┘       └─────────┬──────────┘       └────────┬─────────┘ │
│                                          │                           │           │
│                                          ▼                           ▼           │
│                                ┌──────────────────┐         ┌──────────────────┐ │
│                                │ scripts/         │         │ SLATE-*.zip      │ │
│                                │ bun-version.ts   │         │ Checksums & SBOM │ │
│                                └──────────────────┘         └──────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Single Suite Versioning (ADR 0009)

The entire suite advances on one version number. The three desktop applications, native Rust
crates, and TypeScript packages are locked to this version.

```
.changeset/*.md
      │
      ▼
bun run version
      │
      ├──▶ package.json (root version)
      ├──▶ CHANGELOG.md (release notes)
      ├──▶ Cargo.toml ([workspace.package] version)
      ├──▶ tauri/*/src-tauri/tauri.conf.json (version)
      └──▶ bun.lock (exact lockfile sync)
```

> [!CAUTION]
> **Never Edit Version Numbers Manually.**
> Changing version numbers by hand creates discrepancies between Cargo, Tauri, and Bun.
> Continuous integration runs `bun run scripts/bun-version.ts --check` and automatically
> rejects pull requests with out-of-sync version numbers.

---

## 2. Documenting Changes with Changesets

Every pull request introducing a bugfix, feature, or breaking change must include a changeset:

```powershell
bun run changeset
```

1. Select the packages affected by your change.
2. Choose the bump level (**patch**, **minor**, or **major**).
3. Write a clear, user-facing summary of the change.
4. Commit the generated markdown file in `.changeset/`.

---

## 3. Preparing a Release

When cutting a release from `main`:

### Step 1: Pre-Flight Verification
Verify that the codebase is completely green and dependencies are secure:
```powershell
# Verify all linters, type checks, tests, and builds
bun run check

# Audit supply-chain dependencies
bun run audit

# Ensure fixed-version WebView2 runtime is cached
bun run scripts/bun-webview2.ts --status
```

### Step 2: Apply Changesets & Bump Version
```powershell
bun run version
```
This command:
- Consumes all pending changesets.
- Generates `CHANGELOG.md` entries.
- Runs [`scripts/bun-version.ts`](file:///c:/Users/DUSTI/Documents/Development/Projects/GENCORE/GENCORE.SLATE/scripts/bun-version.ts)
  to mirror the version to Cargo and Tauri configurations.
- Runs `bun install --lockfile-only` to refresh the lockfile.

Review git status and commit the changes:
```powershell
git add -A
git commit -m "chore(release): cut v<version>"
```

---

## 4. Publishing the Release

Push the commit and tag to trigger the automated CI release workflow:

```powershell
git tag v<version>
git push origin main --tags
```

The tag triggers `.github/workflows/release.yml`, which compiles release binaries, assembles
the portable directory structure, and produces:

| Release Artifact | Description |
| --- | --- |
| `SLATE-<version>-win-x64.zip` | The self-contained portable distribution zip |
| `SLATE-<version>-win-x64.zip.sha256` | Cryptographic SHA-256 hash |
| `sbom-cargo.cdx.json` | CycloneDX Software Bill of Materials for Rust crates |
| `sbom-bun.cdx.json` | CycloneDX Software Bill of Materials for JavaScript packages |

---

## 5. Post-Release Integrity Verification

Before public announcement, download the published zip and verify its checksum:

```powershell
# Compute local hash of downloaded file
(Get-FileHash .\SLATE-<version>-win-x64.zip -Algorithm SHA256).Hash.ToLower()

# Compare against the published .sha256 file
Get-Content .\SLATE-<version>-win-x64.zip.sha256
```

---

## 6. Fixing Forward Policy

If a defect is detected in an official release:

> [!IMPORTANT]
> **Do not delete tags or releases.** A deleted tag that has already been pulled or cached
> causes upstream build failures. Always **fix forward**: merge the fix to `main`, increment
> the patch version, and cut a new release while noting the issue in the changelog.

