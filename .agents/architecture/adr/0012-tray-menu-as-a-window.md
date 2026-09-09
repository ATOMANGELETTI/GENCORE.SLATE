# ADR 0012 — The tray menu is a webview window, not a native menu

**Status:** Accepted · **Date:** 2026-09-07

## Context

Each application needs a tray icon, and a tray icon needs a menu. Tauri supports
this directly: attach a [`tauri::menu::Menu`] to a `TrayIcon` and Windows draws
it. That is a few dozen lines and it is reliable.

It is also unstyleable. A native menu renders in the system's colours, the
system's metrics, and the system's typeface. Beside three windows drawn in Nord
and set in Terminess, with a title bar the suite draws itself down to the traffic
lights, it reads as a different program that happens to own the tray icon. The
whole point of ADR 0010's custom chrome is that the suite looks like one product,
and the tray is where a user meets it when no window is open.

The suite already closes to the tray, so the tray menu is not an occasional
extra — it is the only route to Quit, and often the first thing a user sees.

## Decision

The tray menu is a **second webview window** per application, labelled
`tray-menu`, rendering the same `MenuSurface` and `MenuItem` components as the
two in-window context menus.

The window is built once at startup, hidden: `decorations(false)`,
`transparent(true)`, `always_on_top(true)`, `skip_taskbar(true)`,
`resizable(false)`. Its `data_directory` is set explicitly to the portable
WebView2 path, for the same reason `crate::setup` does it for the main window —
omitting it makes Tauri create `%LOCALAPPDATA%\<bundle id>` and breaks the
portability guarantee outright.

On a tray click, `slate_runtime::tray` positions the window against the reported
icon rectangle and shows it. The frontend measures its own content and reports
the size back through `slate_tray_menu_ready`, because the height depends on how
many items the application contributed, on the type scale, and on the user's
zoom — none of which Rust can see. Dismissal is on blur and on Escape.

## Consequences

**Good**

- The tray menu is indistinguishable from the title-bar and content menus,
  because it is literally the same components.
- Anything the kit gains — a checkmark column, a danger tone, a keyboard
  behaviour — reaches the tray for free.
- The menu can show things a native menu cannot: a header naming the
  application, a running indicator, a version.

**Bad**

- Three behaviours a native menu would have supplied have to be written and
  maintained: positioning against the tray rectangle, sizing from a measurement
  that crosses the IPC boundary, and dismiss-on-blur. Each is a place this can
  be subtly wrong on a multi-monitor or scaled display.
- A second WebView2 instance per application, built at startup so the menu does
  not stutter on first open. That is memory spent on a menu.
- The popup needs its own capability file, and therefore its own review.
- Keyboard navigation is hand-rolled here rather than delegated to Radix: there
  is no trigger and no layer, because the window *is* the menu.

## Rejected

**A native `MenuBuilder` menu** — a fraction of the code and completely
reliable, and it looks like a different application. Rejected on the same
grounds as ADR 0010 rejected native window decorations.

**Building the popup window on demand** — avoids the idle WebView2 instance, but
creating a webview takes long enough to show as a stutter between the click and
the menu, which is exactly what makes a tray feel bolted on.

**Reusing the main window as an overlay** — impossible: the menu must appear over
the notification area while the main window is hidden, which is the case that
matters most.

## Revisit when

Tauri gains styleable native menus, or WebView2 gains a lighter-weight popup
surface. Either would remove the reason this exists.
