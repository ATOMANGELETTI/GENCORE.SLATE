---
id: 06-design-system
title: Design system
description: The visual language — tokens, theming, and the macOS-inspired rules every surface follows.
globs: ['packages/slate-tokens/**/*', 'packages/slate-ui-kit/**/*', '**/*.css', '**/*.tsx']
alwaysApply: false
---

# Design system

The look is **modern, flat, minimal, and macOS-inspired**, drawn in **Nord** and
set in **Fira**. Restraint is the whole aesthetic: hairline borders instead
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
| Motion     | `--slate-duration-*`, `--slate-ease-*` | 120–320ms, macOS easing curve |
| Font       | `--slate-font-*`    | `sans` (Fira Sans), `mono` (Fira Code)            |
| Density    | `--slate-density-*` | Row heights. Redefined under `[data-density]`     |
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
| Title bar     | 34px   | Traffic lights left, centred title, right action slot |
| Status bar    | 24px   | Hairline top border, 11px text, three slots           |
| Content area  | fill   | Owns its own scrolling; never scrolls the window body |

## The title bar

macOS reading, faithfully:

- Traffic lights sit **top-left**: close, minimise, zoom, in that order.
- They carry colour only while the window is focused, and desaturate to grey
  when it is not. Symbols appear on hover, not at rest.
- The title is centred, 13px, medium, `--slate-text-secondary`.
- The bar is a drag region (`data-tauri-drag-region`); double-clicking it zooms.
- The right slot holds app-specific actions and stays visually quiet.

## Motion

Purposeful and short. 120ms for a state change, 160ms for an ordinary
transition, 220ms for an entrance, on `--slate-ease-standard`. Nothing
bounces. Nothing spins for decoration. If
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

Two faces from one superfamily, split by **what the text is**, not by where it
appears:

- **Fira Sans** (`--slate-font-sans`) sets anything read as *language* — labels,
  app names, headings, prose.
- **Fira Code** (`--slate-font-mono`) sets anything read as a *value* — a
  version, a count, a byte size, a path, a slash command.

That split is the rule. A folder called "Documents" is language; `0.1.0` beside
it is a value. Reaching for `font-mono` to make something look technical is the
mistake this replaced — when everything was monospaced, a monospaced version
number said nothing.

The scale has **four weights** (400, 500, 600, 700). `font-medium` is the default
for emphasis inside a row, `font-semibold` for a heading or a wordmark, and
`font-bold` is rare and deliberate. `base` is **13px**. ADR 0014 records why this
replaced Terminess, and what it cost.

Uppercase is the house style for structural labelling — section headers, the
status bar, key hints, list rows in the Launcher — and **uppercase always takes
tracking**. Capitals destroy the word shape a reader recognises, so the letters
have to be separated to be read individually: `tracking-wide` at 12px and above,
`tracking-wider` below it, `tracking-widest` for a banded header. Setting
uppercase without tracking is a defect, not a preference. Prose inside a view —
a description, an empty state, help text — stays sentence case; uppercase is for
labels, not sentences.

Eight WOFF2 files ship inside `@slate/ui-kit`, four faces each split into `latin`
and `latin-ext`, so a window rendering only ASCII pays for 24KB rather than 70KB.
**The subsets cover Latin and two arrows and nothing else** — anything outside
that range renders as a replacement box, which is why keyboard hints are spelled
`ENTER` and `ESC` rather than drawn as glyphs.

Never reference a font CDN: the content security policy blocks it, and a
portable app must render identically on a machine with no network. The Nerd Font
builds in `installDir/appdata/resources/fonts/nerdfonts/` are for the future
font-switching feature and are not what the applications currently load.

## Settings that change the tokens

Three preferences move token values at runtime. All three work the same way — a
data attribute on the root element, resolved by the cascade — and none of them
writes a colour or a dimension from script, because a value written by script
cannot respond to the *other* settings.

| Setting | Attribute       | Applied by      | Default       |
| ------- | --------------- | --------------- | ------------- |
| Theme   | `data-theme`    | `applyTheme`    | dark          |
| Density | `data-density`  | `applyDensity`  | comfortable   |
| Accent  | `data-accent`   | `applyAccent`   | cyan          |

Each helper **removes** its attribute for the default rather than writing it, so
the default lives in exactly one place: the `:root` block of the generated
stylesheet.

The accent is the one colour a user can choose, which makes it the one colour a
user can get wrong. The set is therefore closed — three Frost derivations — and
every member is asserted against WCAG AA in both themes by
`packages/slate-tokens/tests/contrast.test.ts`. **Adding an accent means adding
it to `ACCENTS` and letting that test pass**, never widening the picker alone.
