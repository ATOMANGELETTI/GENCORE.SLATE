# ADR 0011 — Nord is the suite's palette

**Status:** Accepted · **Date:** 2026-09-07

## Context

The suite's colour tokens were a neutral grey ramp with a slight blue cast, plus
the macOS system blue as an accent — a reasonable default, and one with no
particular identity. Three applications drawn in it looked like three
applications drawn in the default.

Nord is a published, fixed sixteen-colour scheme with a strong identity and an
existing audience, which makes it a real candidate rather than a taste. It was
not designed as a user-interface system, though. It was drawn for syntax
highlighting, where every colour sits on one background and none of it has to
meet a contrast standard. Adopting it for chrome means confronting the places
where that shows.

The specific problem: `nord3` on `nord0` is **1.6:1**. Nord uses it for source
comments. As interface text it is unreadable, and it is the only value in the
Polar Night group that could plausibly have been a muted text colour. `nord11`,
the Aurora red, is 2.46:1 on `nord1` — it fails as a danger label on every
background the dark theme has. For comparison, GitHub's dark error red reaches
3.99:1 in the same place and VS Code's 4.10:1; both are lightened from their own
palette's base red for exactly this reason.

## Decision

The suite uses the **official Nord palette**, with the four groups in the roles
they were drawn for:

- **Polar Night** (`nord0`–`nord3`) is the dark theme's background ladder.
- **Snow Storm** (`nord4`–`nord6`) is the light theme's, and the dark theme's text.
- **Frost** (`nord7`–`nord10`) is the interactive accent.
- **Aurora** (`nord11`–`nord15`) carries status meaning and the traffic lights.

The sixteen values in `NORD` are exact and stay exact. Where a role has no Nord
answer, the value is **derived from an official colour**, never invented:

- Muted text is `nord4` at 80% alpha, which composites correctly on every Polar
  Night surface rather than being tuned for one.
- The light theme's status colours are Aurora **darkened in HSL**, which keeps
  the hue and saturation that make them recognisable. Darkening in RGB was tried
  first and turns `nord13` into a brown.
- The dark theme's danger colour is `nord11` lightened at its own saturation.

`packages/slate-tokens/tests/contrast.test.ts` asserts every pairing against
WCAG AA, compositing alpha rather than ignoring it. The derived values exist to
clear that bar, and without a gate the claim decays the first time someone
nudges a hex.

Two settings change as a consequence. `material` now defaults to `Solid`: Mica
tints the window with the user's wallpaper, and a Mica-tinted `nord0` is not
`nord0`. `use-system-accent` defaults to off, for the same reason applied to
Frost.

## Consequences

**Good**

- One recognisable identity across three applications, and one a reader can look
  up rather than reverse-engineer from hex values.
- Both themes are contrast-checked in CI, which the previous palette never was.
- Fixing the Tailwind mapping while doing this turned up that `bg-surface`,
  `text-secondary` and every other category-prefixed utility had never resolved
  at all — `text-on-accent` was rendering light text on a light button.

**Bad**

- Nord's own red cannot be used as danger text on Polar Night. The lightened
  substitute reads as a soft red rather than the palette's red, and someone who
  knows Nord will notice. Legibility wins.
- The dark theme's menu surface is `nord1` rather than `nord2`, because `nord2`
  is too light to carry a muted or status label at AA. That leaves one fewer
  background step than the token set nominally has.
- Translucency is off by default, so the suite gives up the Windows 11 look it
  had. It remains available for anyone who prefers it.

## Rejected

**Keeping the neutral ramp** — nothing wrong with it, and nothing memorable
about it either. The request was for an identity.

**Using Nord's values unmodified everywhere** — the honest version of "implement
Nord properly" would have shipped 1.6:1 comment-grey as secondary text. Fidelity
to a palette is not worth an interface people cannot read.

**A second token tier for status fills** (`status-danger-solid` alongside
`status-danger`) — built, then removed. A single red per theme clears both bars
once it is light enough to be ink, so the extra tier bought nothing but a second
name for the same colour.

## Revisit when

Nord publishes an accessibility-oriented extension, or the suite gains a
high-contrast mode — at which point the derived values want revisiting as a set
rather than one at a time.
