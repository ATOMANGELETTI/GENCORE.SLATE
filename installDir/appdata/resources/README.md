# Shared resources

Assets that ship inside the portable zip and are meant to be read from disk at
runtime.

**Nothing here is loaded yet.** Reading a file from this tree needs Tauri's
asset protocol enabled and scoped to `appdata/resources/`, and
`assetProtocol.enable` is `false` in all three `tauri.conf.json` files. Turning
it on widens the attack surface of every window, so it belongs with the feature
that needs it and wants its own architecture decision record — see
`.agents/rules/08-tauri-and-security.md`.

Until then, the applications load what they need from inside their own bundle:
the interface typefaces are WOFF2 files in `packages/slate-ui-kit/src/fonts/`,
and icons are React components from `@slate/icons`.

## `fonts/nerdfonts/`

Nerd Font builds for the future font-switching feature, from
[ryanoasis/nerd-fonts](https://github.com/ryanoasis/nerd-fonts) v3.5.1.

| Directory   | Files                                                    |
| ----------- | -------------------------------------------------------- |
| `firacode/` | `FiraCodeNerdFontMono-Regular.ttf`, `-Bold.ttf`            |
| `terminus/` | `TerminessNerdFontMono-Regular.ttf`, `-Bold.ttf`           |

**Mono, Regular and Bold only.** Each upstream archive carries eighteen
variants at roughly 2.7MB each — fifty megabytes per family, in a repository,
for faces nothing loads yet. Mono is the variant a terminal actually needs, and
Regular and Bold are the two weights the Terminal will ask for. Add a variant
when something is waiting to use it.

Both are SIL Open Font License 1.1; each directory carries its own `LICENSE.txt`.

Note that Fira Code appears twice in this project and the two are not the same
file. The interface loads a **web** Fira Code (WOFF2, Latin subsets, about
30KB) from the UI kit. The copy here is the **Nerd Font patch** (TTF, the full
glyph set including the Powerline and Devicons ranges, 2.7MB) — worth its size
to a terminal and not to a label.

## `icons/lucide/`

The complete Lucide icon set, from
[`lucide-static`](https://www.npmjs.com/package/lucide-static) v1.43.0 — the
same icons `@slate/icons` re-exports as React components, as files.

| Path         | What it is                                              |
| ------------ | ------------------------------------------------------- |
| `icons/`     | 2,077 individual SVGs, one per icon, named as upstream   |
| `sprite.svg` | Every icon as a `<symbol>`, for `<use href="…#name">`    |

Both forms ship because they answer different questions: the individual files
are what an icon picker enumerates, and the sprite is what a page references
without 2,077 requests.

ISC licensed; see `LICENSE.txt`.
