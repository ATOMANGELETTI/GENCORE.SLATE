# ADR 0014 — Fira Sans for language, Fira Code for values

**Status:** Accepted · **Date:** 2026-09-09 · **Supersedes:** [ADR 0013](0013-terminess-ui-typeface.md)

## Context

ADR 0013 made Terminess — the Nerd Fonts patch of Terminus — the suite's
interface typeface, on the grounds that the chrome should read as technical. The
face was bundled, the rule was made true, and the decision closed a real gap:
before it, the design system described fonts that did not exist.

Building the Launcher's actual product surface is what tested it. The app list
is a dense column of twelve to twenty rows at 13px, each carrying a name, a
state and a version. Set entirely in a monospace-derived face, at the size a
desktop list wants, it reads as slower and less finished than the design it was
drawn from — the technical character is still there, but it is being paid for on
every label rather than only where it buys something.

Two secondary constraints from 0013 turned out to be doing damage of their own:

- **Two weights.** Terminess has 400 and 700 and nothing between, so anywhere the
  design wanted emphasis inside a row it got bold. 0013 recorded this as a known
  cost. In a list where most rows carry an emphasised name, it is the difference
  between a hierarchy and a shout.
- **Even sizes only.** A bitmap-hinting constraint that forbade 13px, which is
  both the size a dense desktop list wants and the size
  `.agents/rules/06-design-system.md` had specified for the title bar since it
  was written. The rule and the tokens had simply disagreed.

## Decision

**Two faces from one superfamily, split by what the text *is* rather than by
where it appears.**

- `--slate-font-sans` is **Fira Sans**, and sets anything read as **language**:
  labels, app names, headings, prose.
- `--slate-font-mono` is **Fira Code**, and sets anything read as a **value**: a
  version, a count, a byte size, a path, a slash command.

Fira Sans and Fira Code share a designer and a skeleton, which is what lets both
appear on the same row without a visible seam. Both are SIL OFL 1.1. Fira Code
was already going to be vendored into `installDir/appdata/resources/fonts/
nerdfonts/firacode/` for the later font-switching feature, so the monospace half
is a face the suite was adopting regardless.

The monospace is not retreating — it is concentrating. The Launcher's command
bar, every version column and every path is still set in it, and the Terminal
will be entirely so. What changes is that a folder called "Documents" is no
longer set in a code face.

Three token changes follow:

- **Four weights** — 400, 500, 600, 700. `medium` is the default for emphasis
  inside a row, `semibold` for a heading or a wordmark, `bold` rare and
  deliberate. The `font-bold` that appeared across the kit purely because there
  was nothing between 400 and 700 becomes `font-medium` or `font-semibold`.
- **`base` is 13px** (was 14) and **`xl` is 20px** (was 22). The even-size rule
  is gone with the bitmap face that caused it, and the title bar now matches
  what the design system always said it should be.
- **Weight, tracking and leading reach Tailwind.** They were declared as custom
  properties but never mapped into the `@theme` block, so `font-bold` and
  `tracking-tight` in a component were silently resolving to Tailwind's own
  defaults rather than to the token sitting beside them. Survivable while the
  scales happened to agree; not survivable once tracking became load-bearing for
  uppercase labels.

Eight WOFF2 files ship in `packages/slate-ui-kit/src/fonts/` — four faces split
into `latin` and `latin-ext` with the same unicode ranges Google Fonts uses.
They stay in the kit rather than in `installDir` for the reason 0013 gave and
which still holds: `@slate/ui-kit` has no Tauri dependency by design, and a font
reachable only through the asset protocol would leave the gallery rendering in
Segoe UI.

## Consequences

**Good**

- Labels are set in a face drawn to be read, at the size a dense list wants.
- A real weight scale, so hierarchy comes from weight rather than from boxes,
  borders and bold.
- **240KB of font instead of roughly three megabytes.** Splitting by unicode
  range means a window rendering only ASCII pays for 24KB of Fira Sans regular
  rather than 70KB, let alone 1MB.
- The monospace now marks something. When every label was monospaced, a
  monospaced version number said nothing; now it says "this is a value".
- Fira Sans has a true italic, which Terminus never had.

**Bad**

- The suite loses a distinctive look. A monospace interface is unusual and
  memorable, and this is a more conventional choice — deliberately, but it is a
  real trade.
- Eight font files and eight `@font-face` rules instead of three of each. The
  ranges are duplicated per face, which is verbose.
- Every surface has to be re-reviewed in both themes, because 13px and the new
  weights change every measurement that was tuned against 14px bold.
- The Nerd Font glyph set 0013 valued is no longer loaded by the interface. It
  remains available to the Terminal through the vendored Nerd Font builds, but
  the chrome cannot draw on it.
- The bundled subsets cover Latin and two arrows. Any key hint or marker outside
  that range renders as a replacement box, which is why keyboard hints are
  spelled `ENTER` and `ESC` rather than drawn as glyphs.

## Rejected

**Keeping Terminess and adding weights** — there are none to add. The face has
two, and a synthesised weight on a bitmap-derived outline smears visibly at
13px. This was the constraint, not a configuration.

**Fira Code alone, for both roles** — a smaller change that keeps one family and
fixes the weight problem. It does not fix the underlying one: a monospace is
still a monospace, and the reason to move was the reading, not the weights.

**Inter for the interface** — the better-known choice, arguably more neutral at
small sizes, and what the design system named before ADR 0013. Rejected because
pairing it with Fira Code means two unrelated skeletons on the same row, and
because Fira Sans gets the same job done without adding a third type family to a
project that is already vendoring Fira Code.

**Loading the vendored Nerd Font builds from `installDir`** — rejected for the
same reason as in 0013. It needs the Tauri asset protocol scoped to
`appdata/resources/`, which is disabled everywhere, and it would break the
gallery. That path belongs with the font-switching feature, as its own security
decision.

## Revisit when

The font-switching feature is built. It will need the asset-protocol path
anyway, and it is the point at which a user who wants the monospace interface
back can simply have it — which is the cheapest possible answer to the main cost
recorded above.
