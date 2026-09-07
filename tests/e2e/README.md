# End-to-end tests

**This directory is empty.** The runner and the guardrails exist; the tests do
not yet. That is a known gap, recorded here rather than left to be discovered.

## What is already in place

- `bun run test:e2e` → `scripts/bun-e2e.ts`, which checks that all three
  applications are built and reports what to run if they are not, instead of
  failing with a stack trace.
- CI does **not** run this suite, so an empty directory cannot break the build.

## What is missing

One smoke path per application:

1. Launch the built executable against a temporary portable root.
2. Wait for the window, assert the title bar renders with the expected title
   and that the content area shows the template text.
3. Close the window and assert the process exits cleanly.

The Explorer and Launcher deserve one more each — listing a seeded `storage/`
directory, and discovering an installed application — because both exercise the
`slate-paths` boundary through the real IPC layer rather than a fixture.

## Why it is not done yet

Driving a Tauri window needs `tauri-driver` plus a `msedgedriver` matching the
bundled WebView2 runtime. Both are external binaries, and pinning the driver to
the runtime version is its own piece of work — see `docs/webview2.md`. Doing it
badly (an unpinned driver, a flaky wait) produces a suite that fails randomly
and gets ignored, which is worse than not having one.

The behaviour these tests would cover is currently verified by hand, using
`.agents/workflows/debug-portability.md`.

## When adding them

- Give each test its own temporary portable root; never touch a developer's
  real install.
- Assert on accessible names, not CSS classes — the same rule as the component
  tests.
- Keep them out of the pull-request path until they are reliably green. A
  flaky end-to-end suite trains people to ignore red builds.
