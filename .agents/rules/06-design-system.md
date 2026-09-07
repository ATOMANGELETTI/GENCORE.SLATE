---
id: 06-design-system
title: Design system
description: The visual language — tokens, theming, and the macOS-inspired rules every surface follows.
globs: ['packages/slate-tokens/**/*', 'packages/slate-ui-kit/**/*', '**/*.css', '**/*.tsx']
alwaysApply: false
---

# Design system

The look is **modern, flat, minimal, and macOS-inspired**. Restraint is the
whole aesthetic: hairline borders instead of heavy ones, layered low-opacity
shadows instead of drop shadows, generous space instead of dividers, and one
accent colour used sparingly.

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
| Accent     | `--slate-accent-*`  | Follows the Windows accent colour when available |
| Status     | `--slate-status-*`  | `success`, `warning`, `danger`, `info`           |
| Space      | `--slate-space-*`   | 4pt grid: `1` = 4px … `16` = 64px                |
| Radius     | `--slate-radius-*`  | `sm` 6, `md` 8, `lg` 10, `xl` 14, `full`         |
| Shadow     | `--slate-shadow-*`  | `sm`, `md`, `lg`, `overlay`                      |
| Motion     | `--slate-duration-*`, `--slate-ease-*` | 150–220ms, macOS easing curve |
| Font       | `--slate-font-*`    | `sans` (Inter), `mono` (Geist Mono)              |

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

## Fonts

Inter Variable and Geist Mono ship as font files inside `@slate/ui-kit`. Never
reference a font CDN: the content security policy blocks it, and a portable app
must render identically on a machine with no network.
