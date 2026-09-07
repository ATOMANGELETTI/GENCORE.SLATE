# The WebView2 runtime

GENCORE.SLATE bundles a **fixed-version** WebView2 runtime so the suite renders
identically everywhere and works on a machine that has never had Edge installed.
The reasoning is in [ADR 0005](../.agents/architecture/adr/0005-bundled-webview2.md).

This is the **only** part of the build that cannot be fully automated, so it is
worth understanding once.

## Why it needs a human

Microsoft publishes two WebView2 distributions:

| Distribution      | Stable download URL | Suitable here                                |
| ----------------- | ------------------- | -------------------------------------------- |
| Evergreen bootstrapper | Yes            | No — installs system-wide, needs the network |
| Fixed version     | **No**              | Yes — a private copy the app carries          |

The fixed-version archive is only offered behind a form on the Microsoft
developer site, with a URL that changes between releases. There is nothing to
`curl`. So the archive is fetched once by a person, and everything after that —
verification, extraction, caching, packaging — is automated.

## One-time setup

### 1. Download

Go to <https://developer.microsoft.com/microsoft-edge/webview2/>, choose **Fixed
Version**, select the **x64** build, and match the version pinned in
[`webview2.lock.json`](../webview2.lock.json).

### 2. Verify and extract

```bash
SLATE_WEBVIEW2_CAB=C:\path\to\downloaded.cab bun run webview2:fetch
```

This checks the archive against the SHA-256 in `webview2.lock.json`, extracts it
with `expand.exe`, and caches the result in `.cache/webview2/` (git-ignored).

**On the very first fetch** the lockfile's `sha256` is empty, so nothing is
verified. Record the digest the script prints into `webview2.lock.json` and
commit it — from then on a corrupt or substituted archive fails loudly.

### 3. Confirm

```bash
bun run scripts/bun-webview2.ts --status
```

## What happens at build time

```bash
bun run package            # development: skips the runtime, warns clearly
bun run package:release    # release: fails if the runtime is missing
```

A release that silently dropped the runtime would produce a zip that appears to
work on the developer's machine and fails on a clean one — the exact failure
this architecture exists to prevent. So the release path refuses to continue.

## How it takes effect

Before any window is created, `slate_runtime::bootstrap` sets:

| Variable                             | Points at                          |
| ------------------------------------ | ---------------------------------- |
| `WEBVIEW2_BROWSER_EXECUTABLE_FOLDER` | `appdata/binaries/webview2/`       |
| `WEBVIEW2_USER_DATA_FOLDER`          | `appdata/webview2/<app-id>/`       |

The order matters: WebView2 reads its environment when the first webview is
created, so setting either variable afterwards silently has no effect.

The second variable matters as much as the first. Without it, WebView2 writes
its browser profile — cache, cookies, local storage — into `%LOCALAPPDATA%`, and
the suite stops being portable while still appearing to work.

The runtime folder is only used when it actually contains `msedgewebview2.exe`.
A development tree usually has no runtime bundled, so the system one is used and
a warning is logged rather than the window failing to open at all.

## Updating

The bundled runtime is **our** security responsibility — Renovate cannot see it.
At each release:

1. Check whether a newer fixed version is available.
2. Update `version` and `sha256` in `webview2.lock.json`.
3. Re-fetch, rebuild, and confirm all three windows still render.

## Size

The runtime adds roughly 150–200 MB to the zip. For a suite meant to live on a
drive the user carries, that is the price of working on any machine — and it is
the reason the zip is a zip rather than a download stub.
