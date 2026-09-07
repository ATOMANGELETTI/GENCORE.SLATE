# ADR 0003 — Separate binaries, with the broker hosted in the Launcher

**Status:** Accepted · **Date:** 2026-09-06

## Context

The suite is three applications that must sometimes cooperate: the Launcher
tracks what is running, Explorer wants to open a directory in Terminal,
settings changed in one app should be visible to the others.

Three shapes were possible:

1. **One binary, many windows.** Smallest footprint, trivial state sharing —
   but one crash takes down the entire suite, and every app is redeployed
   whenever any app changes.
2. **Separate binaries, no shared channel.** Maximum isolation, but no
   cross-app features at all.
3. **Separate binaries plus a coordination channel.**

## Decision

Each application is its own Tauri binary. They coordinate through an IPC
broker, and **the broker is hosted inside the Launcher process** rather than
being a fourth executable.

The Launcher is already the suite's session owner: it is what the user starts,
and it already supervises every child process it spawns. Giving it the broker
adds no new lifecycle to manage.

The pipe is named `\\.\pipe\gencore.slate.<hash of the portable root>`, so two
copies of the suite running from different directories never interfere.

## Consequences

**Good**

- A crash is contained to one application.
- Apps can be updated independently.
- No fourth process to start, supervise, or explain to a user.
- Hashing the root preserves the portable promise: a USB copy and a local copy
  coexist cleanly.

**Bad**

- Cross-app features are unavailable when the Launcher is not running. Every
  app therefore **must** work standalone, logging the broker's absence once and
  degrading quietly. This is a permanent requirement, not a temporary gap.
- Shared state costs a round trip rather than a function call. Acceptable: the
  traffic is small and infrequent.

## Rejected

**One binary, many windows** — a single panic killing all three apps is not
acceptable for a file manager and a terminal.

**A standalone broker executable** — it buys independence from the Launcher's
lifetime, at the cost of an extra process, an extra failure mode, and an extra
thing in Task Manager the user did not ask for. If the Launcher later becomes
optional, this decision should be revisited with a new ADR.
