# Security

## Reporting a vulnerability

Report privately through GitHub's **Report a vulnerability** button on the
Security tab, or by email to <DUSTIN@angeletti.space>. Please do not open a
public issue for a security problem.

Include what you found, how to reproduce it, and what an attacker could do with
it. You will get an acknowledgement within a few days.

## What this project already assumes

Some properties are structural rather than incidental. A report showing that one
of them is broken is especially valuable:

- **Nothing is written outside the portable root.** No registry keys, no
  `%APPDATA%`, no `%TEMP%`. Anything that escapes is a defect.
- **A path from the webview cannot reach outside the root.** Every externally
  supplied path goes through `SlatePaths::resolve_within`, which rejects rather
  than clamps.
- **Applications hold the narrowest Tauri capabilities they can.** The Terminal
  ships with no shell or process permission at all; the Explorer's filesystem
  scope stops at `storage/`.
- **The content security policy admits no remote origin.** Fonts, styles, and
  scripts are all bundled.

## Known limitations

Documented rather than hidden:

- **Builds are unsigned.** SmartScreen warns on first run. Code signing is
  intended; until then, verify the published SHA-256.
- **The suite trusts its own `installDir`.** Anyone able to write into the
  portable root can replace an executable. This is inherent to portable
  software and matches how comparable suites behave.
- **The bundled WebView2 runtime is updated by us**, not by Windows Update. It
  is reviewed at each release — see `docs/webview2.md`.
