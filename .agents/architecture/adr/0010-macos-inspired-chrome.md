# ADR 0010 — macOS-inspired chrome with traffic lights on the left

**Status:** Accepted · **Date:** 2026-09-06

## Context

The suite is Windows-only, but the intended visual language is modern, flat,
minimal, and macOS-inspired. Custom window chrome is required regardless —
Tauri windows run with `decorations: false` so that the title bar can be part
of the application rather than an OS strip above it.

That leaves a genuine question: where do the window controls go? Windows users
reach for the top-right. macOS puts them top-left as coloured dots.

## Decision

Traffic lights sit **top-left**: close, minimise, zoom, in that order. The
title is centred; the top-right is an application-actions slot.

Faithfulness to the intended aesthetic wins over local muscle memory. A
half-macOS design — the flat surfaces and hairlines but Windows control
placement — reads as neither, and the placement is the single most recognisable
element of the language being borrowed.

Details that matter for it to read as deliberate rather than approximate:

- Controls carry colour only while the window is focused, and desaturate to
  grey when it is not.
- Symbols appear on hover, not at rest.
- The bar is a drag region; double-clicking it zooms.
- Height is 34px, with a hairline bottom border. (Amended from an initial
  38px: still comfortably above the 12px traffic lights and their 8px gap,
  and closer to the tighter macOS bar this decision is borrowing from. The
  placement, order, and focus behaviour this ADR settles are unaffected —
  this is a single token value, not a reopening of the decision.)

## Consequences

**Good**

- One unmistakable, consistent identity across all three applications.
- The title bar is application space, usable for real controls.
- Encoded once in `@slate/ui-kit`, so every app gets it for free.

**Bad**

- Windows users will occasionally aim top-right to close a window. This is the
  accepted cost of the choice.
- Snap Layouts, which are attached to the system maximise button, are lost. The
  zoom control must therefore behave correctly on double-click and keyboard,
  and window state is persisted so users are not fighting the window manager.

## Rejected

**Controls on the right, macOS aesthetic elsewhere** — safer, and consistently
described in review as looking like an unfinished port of something else.
