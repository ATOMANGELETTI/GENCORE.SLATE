---
title: Design system
description: The visual language — tokens, theming, and the macOS-inspired rules every surface follows.
globs: packages/slate-tokens/**/*,packages/slate-ui-kit/**/*,**/*.css,**/*.tsx
alwaysOn: false
---

<!--
  GENERATED FILE — DO NOT EDIT.

  Source: .agents/rules/
  Regenerate: bun run agents:sync

  Edits here are overwritten by the next sync and rejected by CI
  (`bun run agents:check`). Change the rule in .agents/ instead.
-->

# Design system

The look is **modern, flat, minimal, and macOS-inspired**, drawn in **Nord** and
set in **Terminess**. Restraint is the whole aesthetic: hairline borders instead
of heavy ones, layered low-opacity shadows instead of drop shadows, generous
space instead of dividers, and one accent colour used sparingly.

## Tokens are the only source of colour, space, and motion

Every value comes from `@slate/tokens`, exposed as CSS custom properties and
surfaced to Tailwind through `@theme`.

```tsx
<div className="bg-surface text-primary border-hairline rounded-lg" />  // correct
<div className="bg-[#1c1c1e] text-[#f5f5f7] border-[#ffffff14]" />      // never
```

A hard-coded colour, pixel value, or duration anywhere outside
`packages/slate-tokens` is a defect. If a value you need does not exist, add a
token — do not inline it "just this once".

## Token categories

| Category   | Prefix              | Notes                                            |
| ---------- | ------------------- | ------------------------------------------------ |
| Background | `--slate-bg-*`      | `canvas`, `surface`, `elevated`, `overlay`, `inset` |
| Text       | `--slate-text-*`    | `primary`, `secondary`, `tertiary`, `inverted`   |
| Border     | `--slate-border-*`  | `hairline`, `strong`, `focus`                    |
| Accent     | `--slate-accent-*`  | Nord Frost. Not the Windows accent — see below     |
| Status     | `--slate-status-*`  | `success`, `warning`, `danger`, `info`           |
| Space      | `--slate-space-*`   | 4pt grid: `1` = 4px … `16` = 64px                |
| Radius     | `--slate-radius-*`  | `sm` 6, `md` 8, `lg` 10, `xl` 14, `full`         |
| Shadow     | `--slate-shadow-*`  | `sm`, `md`, `lg`, `overlay`                      |
| Motion     | `--slate-duration-*`, `--slate-ease-*` | 150–220ms, macOS easing curve |
| Font       | `--slate-font-*`    | `sans` (Terminess Propo), `mono` (Terminess Mono) |
| Menu       | `--slate-chrome-menu*` | Width, item height, radius, padding            |

## The palette is Nord

`packages/slate-tokens/src/tokens/color.tokens.ts` holds the official sixteen
Nord colours in `NORD`, exact and not to be adjusted. Each group has one job:
Polar Night is the dark theme's backgrounds, Snow Storm the light theme's and
the dark theme's text, Frost the interactive accent, Aurora the status colours
and the traffic lights.

Nord was drawn for syntax highlighting, so a few roles have no Nord answer —
`nord3` on `nord0` is 1.6:1 and cannot be interface text. Those are **derived
from an official colour**, never invented: an alpha tint where the value sits on
several surfaces, an HSL lightness shift where it has to stay legible as ink.
`packages/slate-tokens/tests/contrast.test.ts` asserts every pairing against
WCAG AA and is what stops a nudged hex quietly breaking one. ADR 0011 records
the decision and its costs.

Two settings exist that would undo it, and both default to off: `material`
(Mica tints the window with the user's wallpaper) and `use-system-accent`.

## Theming

Light and dark are both first-class; **dark is the default**. Themes are
implemented as token redefinitions under `[data-theme='light']` and
`[data-theme='dark']` on the root element, resolved at startup from the user's
setting or the system preference.

Never branch on the theme in a component. If a component needs to know the
theme to look right, the token set is wrong.

## Layout constants

| Surface       | Height | Notes                                                |
| ------------- | ------ | ---------------------------------------------------- |
| Title bar     | 38px   | Traffic lights left, centred title, right action slot |
| Status bar    | 24px   | Hairline top border, 11px text, three slots           |
| Content area  | fill   | Owns its own scrolling; never scrolls the window body |

## The title bar

macOS reading, faithfully:

- Traffic lights sit **top-left**: close, minimise, zoom, in that order.
- They carry colour only while the window is focused, and desaturate to grey
  when it is not. Symbols appear on hover, not at rest.
- The title is centred, 13px, semibold, `--slate-text-secondary`.
- The bar is a drag region (`data-tauri-drag-region`); double-clicking it zooms.
- The right slot holds app-specific actions and stays visually quiet.

## Motion

Purposeful and short. 150ms for state changes, 220ms for entrances, on
`--slate-ease-standard`. Nothing bounces. Nothing spins for decoration. If
`prefers-reduced-motion` is set, transitions collapse to opacity only.

## Menus

Three surfaces share one menu: the title bar's, the content area's, and the
tray's. They are built from `MenuSurface`, `MenuItem`, `MenuSeparator` and
`MenuHeader` in `@slate/ui-kit`, and an application supplies only the *items*.

- Item height 30px, a 14px leading glyph, the shortcut right-aligned in
  `--slate-text-tertiary`.
- A rule is full-bleed, so groups read as regions rather than as a stray line.
- `tone="danger"` is for anything that discards or terminates. The label carries
  the meaning; the colour only reinforces it.
- A disabled item explains itself through `unavailableReason`. A greyed item
  with no explanation wastes the reader's time, and a control that can *never*
  be enabled should be absent.
- The three menus must differ. A right-click that offers the same list wherever
  it lands is telling the user their click carried no meaning.

The tray menu is a webview window rather than a native one, which is what lets
it use these components at all — ADR 0012.

## Fonts

Terminess Nerd Font ships as WOFF2 inside `@slate/ui-kit`: `Propo` for the
interface, `Mono` for anywhere columns must line up. It is a monospace-derived
face used deliberately as the interface face, and it has **two weights, 400 and
700** — there is no semibold to reach for, and the type scale snaps to even
sizes because Terminus was drawn for small bitmap sizes. ADR 0013 records why.

Never reference a font CDN: the content security policy blocks it, and a
portable app must render identically on a machine with no network. The fonts in
`installDir/appdata/resources/fonts/` are for the future font-switching feature
and are not what the applications currently load.
