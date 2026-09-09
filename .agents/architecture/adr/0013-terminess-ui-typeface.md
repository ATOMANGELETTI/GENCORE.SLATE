# ADR 0013 — Terminess is the interface typeface, not just the code one

**Status:** Accepted · **Date:** 2026-09-07

## Context

`.agents/rules/06-design-system.md` claimed Inter Variable and Geist Mono shipped
as font files inside `@slate/ui-kit`. They never existed. Every window in the
suite has been rendering in Segoe UI, which is a perfectly good typeface and not
the one the design system described — so the rule was documenting an intention,
and nobody could tell because the fallback was unremarkable.

That had to be resolved one way or the other, since the content security policy
allows `font-src 'self'` and nothing else: a portable application has to render
identically with the network cable unplugged, so a font is bundled or it is the
system's.

Separately, the suite's chrome is meant to read as technical rather than
friendly. A monospace-derived interface face is an unusual choice and a strong
one, and Terminess — the Nerd Fonts patch of Terminus — was the specific face
asked for.

## Decision

**Terminess Nerd Font is the interface typeface**, not merely the code one.
`--slate-font-sans` is `Terminess Nerd Font Propo`, whose proportional glyph
advances are correct for labels and menus; `--slate-font-mono` is
`Terminess Nerd Font Mono`, for anywhere columns must line up.

Three faces ship as WOFF2 in `packages/slate-ui-kit/src/fonts/`, converted once
from the upstream TTFs with `wawoff2` — roughly 2.7 MB each becomes 1 MB, and
there is deliberately no conversion dependency in any manifest. They live in the
kit rather than in `installDir/appdata/resources/fonts/` because `@slate/ui-kit`
has no Tauri dependency by design, and a font reachable only through the asset
protocol would leave the component gallery rendering in Consolas.

Two token changes follow from the face itself:

- **Weights collapse to 400 and 700**, because Terminess has two. The previous
  scale's 500, 590 and 680 have no face here, and asking the renderer to
  synthesise them smears a bitmap-derived outline visibly at 14px.
- **The type scale snaps to even sizes** (10, 11, 12, 14, 16, 18, 22, 28).
  Terminus was drawn as a bitmap face for small sizes; an odd size lands the
  stems between pixels.

## Consequences

**Good**

- The interface finally renders in the typeface the design system claims, and
  the claim is now true rather than aspirational.
- The Nerd Fonts patch brings a large glyph set, which the tray icons and any
  future terminal work can draw on.
- Bundled, so it needs no CSP change and works offline — and the gallery shows
  what applications will actually show.

**Bad**

- Three megabytes of font in the repository and in every application's bundle.
  Real, and small beside the WebView2 runtime the zip already carries.
- Two weights is a thin scale. Anywhere the design wanted a semibold now gets
  bold, which is a heavier step than intended.
- A monospace-derived face is harder to read in long prose than a text face
  would be. Acceptable for chrome; worth revisiting if the suite ever grows a
  document surface.
- Terminus has no true italic, so emphasis has to come from weight or colour.

## Rejected

**Keeping the system fallback and correcting the rule** — the honest cheap
option, and it gives up the distinctive look entirely.

**Loading fonts from `installDir/appdata/resources/fonts/`** — where the
user-switchable fonts will eventually live, and where these files were first
placed. It needs the Tauri asset protocol scoped to that directory, which is
currently disabled everywhere, and it would break the gallery. That path belongs
with the font-switching feature, as its own security decision.

**Subsetting the fonts** — would cut the 1 MB substantially, but needs
`pyftsubset` or equivalent: a Python toolchain in a Bun-only project, for a
saving the zip does not need.

## Revisit when

The font-switching feature is built, which will need the asset-protocol path
anyway and may make the bundled copy a fallback rather than the only source.
