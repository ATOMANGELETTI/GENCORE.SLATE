---
'@slate/tokens': minor
'@slate/ui-kit': minor
'@slate/icons': minor
'@slate/ipc': minor
'@slate/bindings': minor
'slate-launcher': minor
'slate-terminal': minor
'slate-explorer': minor
---

Redraw the suite in Nord, set it in Terminess, and give every application
three context menus, a tray icon, and a working title bar.

The palette is now the official Nord scheme — Polar Night for the dark theme,
Snow Storm for the light one, Frost as the accent and Aurora for status and the
traffic lights (ADR 0011). Every text-on-background pairing is asserted against
WCAG AA by a new test, which is what the handful of derived values exist to
clear: `nord3` on `nord0` is 1.6:1 and cannot be interface text.

The interface renders in Terminess Nerd Font, bundled as WOFF2 (ADR 0013). The
design system had claimed to ship Inter and Geist Mono; neither ever existed, so
every window had been rendering in Segoe UI until now.

Right-clicking now works in three places, with a different menu in each: window
operations on the title bar, application operations in the content area, and a
tray menu drawn as its own webview window so it matches the rest of the suite
(ADR 0012). Each application has its own tray glyph, in both a light and a dark
variant that follows the real Windows taskbar theme live — a single colour was
disappearing against half of the two backgrounds it has to sit on. Closing a
window hides it to the tray; Quit is offered only from there.

The title bar can actually be dragged now — the custom chrome was missing the
`core:window:allow-start-dragging` capability, so every drag silently did
nothing. It is also 4px shorter, closer to the macOS bar the chrome is drawn
from, and the leftover settings icon in its trailing slot is gone now that
Preferences lives in the content menu instead.

Preferences and About are no longer permanently disabled. Preferences reveals
the application's own config file in the system file explorer — there is no
settings window yet, but the file it would eventually edit is useful today.
About opens a small dialog, built on the same Radix primitive and visual
language as the rest of the menu system, naming the application and its
version. The tray's "Check for Updates" opens a real notice in the same window
rather than sitting greyed out.

The Launcher can start Terminal and Explorer from its tray menu: the packaged
executable in production, or that application's own `bun run dev:<app>` script
in a development checkout, which has no packaged executable to run yet.

The pale ring around each window is gone, so the frame reads as flat against
the desktop, and its corners are square rather than rounded — WebView2 does not
reliably punch a transparent hole in a rounded corner, so a rounded window was
showing an opaque white square in the gap instead of the transparency the shape
implied.

Two defaults change as a consequence of the palette: `material` is now `solid`
and `use-system-accent` is off, because Mica tints the window with the user's
wallpaper and an arbitrary accent colour is not Frost.

Fixes a latent bug in the token pipeline: category-prefixed colour roles were
emitted as `--color-bg-surface`, so the `bg-surface`, `text-secondary` and
`border-hairline` utilities every component writes resolved to nothing at all.
Most visibly, `text-on-accent` had been rendering light text on the light
accent button at 2:1.
