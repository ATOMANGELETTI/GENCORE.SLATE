---
'@slate/tokens': minor
'@slate/ui-kit': minor
'@slate/icons': minor
'slate-launcher': minor
'slate-terminal': minor
'slate-explorer': minor
'gencore-slate': minor
---

Build the Launcher's actual product surface, and move the suite's interface
face from Terminess to Fira Sans and Fira Code.

The Launcher opens on a Bureau layout: a search-and-command bar across the top,
an application list on the left grouped into Pinned, Suite and Portable, and an
identity-and-folders rail on the right. Typing `/` switches the bar from
filtering applications to composing a command — `/run --terminal`,
`/config --theme dark`, `/pin downloader` — with fuzzy matching, inline
ghost-text completion, and argument hints that appear as you type. The bar also
does arithmetic and unit conversion in place: `1920*0.75` or `4gb in mb` answer
directly, through a hand-written parser rather than `eval`, which the content
security policy forbids anyway.

Five buttons at the foot of the rail open Storage, Add application, Console,
Settings and About. Opening one widens the window and swaps the list and rail
for the view, whose own menu keeps the same five buttons so a view is somewhere
you move between rather than something you back out of. `/help`, and the `?`
key, open a reference generated from the same command definitions the bar
itself reads, so the two cannot say different things.

Two things in this view are described but not wired up yet, and say so on the
page: file search (`/find`) needs a filesystem-search command that does not
exist, and browsing a portable-app catalogue needs network access the content
security policy does not currently grant.

Terminess — the Nerd Fonts patch of Terminus — is no longer the interface
typeface. Fira Sans now sets anything read as language: labels, names,
headings. Fira Code, already the suite's code face, now also carries anything
read as a value: a version, a count, a byte size, a slash command. Terminess
had two weights and no size between 12 and 14px could be set cleanly; the new
scale has four weights and a size built for a dense list. ADR 0014 records the
decision, its cost, and what was rejected.

Row density (comfortable or compact) and the accent colour are now user
settings rather than fixed values, both applied as attributes on the window the
way the theme already is. The accent is a closed set of three Nord Frost
derivations, each checked against WCAG AA in both themes — a fourth candidate,
closer to Nord's own blue, was tried and dropped for being too close to
another to tell apart in a picker.

Fixes a token-pipeline bug this depended on: `tracking-*`, `font-weight-*` and
`leading-*` were declared as CSS custom properties but never reached Tailwind's
`@theme` block, so `tracking-tight` and `font-bold` in every component had been
silently resolving to Tailwind's own defaults rather than the token beside
them.

Fixes two packaging defects, both found by extracting the built zip to a fresh
path and running it: `appdata/resources` was created but never populated, so
the Nerd Fonts and Lucide icons vendored for the future font-switching feature
would have shipped as an empty folder; and every application's window seeded
from one shared default, so editing the Launcher's checked-in configuration had
no effect on what actually shipped.
