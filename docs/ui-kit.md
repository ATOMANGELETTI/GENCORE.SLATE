# UI Kit & Design System Guide

The GENCORE.SLATE visual design language is **modern, minimal, and macOS-inspired**.
Visual restraint defines the entire aesthetic: subtle hairline borders, layered low-opacity
shadows, generous whitespace, and a single accent color used with purpose.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            DESIGN SYSTEM ARCHITECTURE                            │
│                                                                                  │
│   @slate/tokens (Single Source of Truth)                                         │
│   ├── CSS Custom Properties (--slate-bg-*, --slate-text-*, --slate-space-*)      │
│   └── Tailwind CSS v4 Theme Integration (@theme)                                 │
│                                │                                                 │
│                                ▼                                                 │
│   @slate/ui-kit (Shared Component Library)                                       │
│   ├── TitleBar (34px, Traffic Lights, Drag Region)                               │
│   ├── StatusBar (24px, System Metrics, Status Slots)                             │
│   ├── Buttons, ContextMenus, Dialogs, TextFields, NavItems, Switches             │
│   └── Offline Bundled Fonts (Fira Sans, Fira Code)                               │
│                                │                                                 │
│                                ▼                                                 │
│   Tauri Applications (slate-launcher, slate-explorer, slate-terminal)            │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Design Tokens as the Single Source of Truth

Every color, spacing value, border radius, and animation curve is declared in
[`@slate/tokens`](file:///c:/Users/DUSTI/Documents/Development/Projects/GENCORE/GENCORE.SLATE/packages/slate-tokens).

> [!CAUTION]
> **No Hard-Coded Values.** Arbitrary hex codes (`#1c1c1e`), custom pixel widths, or
> ad-hoc transition timings are strictly forbidden in components.
> If a value does not exist in the tokens package, add it to `@slate/tokens` — never inline it.

### Token Categories

| Category | CSS Variable Prefix | Tailwind Class Example | Description |
| --- | --- | --- | --- |
| **Background** | `--slate-bg-*` | `bg-surface`, `bg-canvas`, `bg-elevated` | Layered surfaces from canvas to popovers |
| **Text** | `--slate-text-*` | `text-primary`, `text-secondary`, `text-tertiary` | High-contrast hierarchy |
| **Border** | `--slate-border-*` | `border-hairline`, `border-strong` | 1px subtle and accented borders |
| **Accent** | `--slate-accent-*` | `bg-accent-default`, `text-accent-default` | Nord Frost. User-selectable from a closed set of three |
| **Status** | `--slate-status-*` | `text-status-success`, `bg-status-danger` | System status (green, amber, red, blue) |
| **Spacing** | `--slate-space-*` | `p-4`, `gap-2` | 4pt spatial grid (`1` = 4px ... `16` = 64px) |
| **Radius** | `--slate-radius-*` | `rounded-md`, `rounded-lg` | Standard curve scale (6px, 8px, 10px, 14px) |
| **Shadow** | `--slate-shadow-*` | `shadow-sm`, `shadow-overlay` | Layered ambient and directional shadows |
| **Motion** | `--slate-duration-*`| `duration-[var(--slate-duration-fast)]`, `ease-standard` | 120ms state changes, 220ms entrances |
| **Density** | `--slate-density-*` | `h-[var(--slate-density-row)]` | Row heights. Redefined under `[data-density='compact']` |

---

## 2. Theming & Dark Mode

GENCORE.SLATE supports both **Dark** and **Light** themes. **Dark is the default.**

- Themes are implemented by swapping CSS custom properties under `[data-theme='light']`
  and `[data-theme='dark']` on the root document element.
- **Never branch conditionally on the theme in component logic.** If a component needs
  `if (theme === 'dark')` to render properly, the design tokens are incomplete.

---

## 3. Window Layout Constants

Every application window follows standardized vertical metrics:

| Surface | Fixed Height | Design Rules |
| --- | --- | --- |
| **Title Bar** | `34px` | Traffic lights on top-left, centered 13px title, right action slot, drag region. |
| **Status Bar** | `24px` | Hairline top border, 11px font size, three info slots. |
| **Content View** | Flex Fill | Owns its own scrolling; window body is `overflow: hidden`. |

### macOS-Style Title Bar Specification
- **Traffic Lights:** Close, Minimise, and Zoom controls sit in the top-left corner.
- **Focus Sensing:** When the window loses focus, traffic lights desaturate to neutral grey.
  Glyphs appear only on hover.
- **Drag Region:** Marked with `data-tauri-drag-region` to allow window movement. Double-clicking
  toggles window zoom/maximize.

---

## 4. Typography & Bundled Fonts

Portable applications cannot rely on external font CDNs:
1. Connecting to remote CDNs violates the suite's strict Content Security Policy (CSP).
2. The application must render identically on air-gapped computers without network connectivity.

`@slate/ui-kit` bundles both faces locally, as eight WOFF2 files — four faces
each split into `latin` and `latin-ext`, so a window rendering only ASCII pays
for 24KB rather than 70KB:

- **Interface:** Fira Sans, weights 400/500/600 (`--slate-font-sans`)
- **Values and code:** Fira Code, weight 400 (`--slate-font-mono`)

The split is by **what the text is**, not by where it appears. Anything read as
language — a label, an app name, a heading — is `sans`. Anything read as a value
— a version, a count, a byte size, a path, a slash command — is `mono`. ADR 0014
records why this replaced Terminess.

The bundled subsets cover Latin and two arrows and nothing else, so anything
outside that range renders as a replacement box. That is why keyboard hints are
spelled `ENTER` and `ESC` rather than drawn as glyphs.

---

## 5. Component Preview Gallery

The UI Kit includes an interactive gallery to test components across themes, view states,
and interactive interactions:

```powershell
bun run gallery
```

### Why the Gallery Runs in a Browser
The gallery boots an independent Vite server at `http://localhost:1430/gallery/`.
It runs in a standard browser rather than a Tauri window. This enforces a crucial
architectural boundary: **components in `@slate/ui-kit` must remain completely decoupled
from Tauri native APIs and operating system bindings**.

