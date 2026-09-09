/**
 * Spacing, radii, typography, elevation, and motion.
 *
 * Every value a component can use lives here. A literal in a component is a
 * defect — see `.agents/rules/06-design-system.md`.
 */

/**
 * A 4pt spacing grid.
 *
 * One grid, used everywhere, is what makes unrelated screens feel like the
 * same product. The keys are multipliers, so `space-4` is 16px.
 *
 * Half steps are written `0-5` rather than `0.5`: a dot is not a legal
 * character in a CSS custom-property name, and `--slate-space-0.5` is silently
 * dropped by the parser rather than rejected loudly.
 */
export const SPACE = {
	0: '0px',
	px: '1px',
	'0-5': '2px',
	1: '4px',
	'1-5': '6px',
	2: '8px',
	3: '12px',
	4: '16px',
	5: '20px',
	6: '24px',
	8: '32px',
	10: '40px',
	12: '48px',
	16: '64px',
} as const;

/**
 * Corner radii.
 *
 * Deliberately larger than a typical Windows application and smaller than a
 * "friendly" web app — the restrained curvature that reads as macOS.
 */
export const RADIUS = {
	none: '0px',
	sm: '6px',
	md: '8px',
	lg: '10px',
	xl: '14px',
	'2xl': '18px',
	full: '9999px',
} as const;

/** Type scale. Sizes are px; line heights are unitless ratios. */
export const TYPOGRAPHY = {
	/**
	 * Terminess is the Nerd Fonts patch of Terminus, and it is the suite's
	 * interface face, not just its code face — the chrome is meant to read as
	 * technical. `Propo` has proportional glyph advances and is correct for
	 * labels; `Mono` is strictly monospaced and belongs anywhere columns must
	 * line up. Both ship inside `@slate/ui-kit`; the fallbacks exist only for
	 * the moment before the WOFF2 lands.
	 */
	family: {
		sans: "'Terminess Nerd Font Propo', 'Cascadia Code', 'Consolas', ui-monospace, monospace",
		mono: "'Terminess Nerd Font Mono', 'Cascadia Code', 'Consolas', ui-monospace, monospace",
	},
	/**
	 * Terminus was drawn as a bitmap face for small sizes, so the scale snaps
	 * to even values: an odd size lands the stems between pixels and the whole
	 * interface goes soft.
	 */
	size: {
		'2xs': '10px',
		xs: '11px',
		sm: '12px',
		base: '14px',
		md: '16px',
		lg: '18px',
		xl: '22px',
		'2xl': '28px',
	},
	/**
	 * Two weights, because Terminess has two. The intermediate weights the
	 * previous sans-serif scale carried (500, 590, 680) have no face here, and
	 * asking the renderer to synthesise them smears a bitmap-derived outline
	 * badly enough to be obvious at 14px.
	 */
	weight: {
		regular: '400',
		bold: '700',
	},
	leading: {
		tight: '1.25',
		normal: '1.45',
		relaxed: '1.65',
	},
	tracking: {
		tight: '-0.01em',
		normal: '0',
		wide: '0.02em',
		/** For the small capitalised labels the menus and the tray header use. */
		wider: '0.06em',
	},
} as const;

/**
 * Elevation.
 *
 * Layered, low-opacity shadows rather than one heavy drop shadow: a hairline
 * ambient ring plus a soft directional shadow is what reads as depth without
 * looking heavy.
 */
export const SHADOW = {
	none: 'none',
	sm: '0 1px 2px rgb(0 0 0 / 0.08), 0 0 0 0.5px rgb(0 0 0 / 0.04)',
	md: '0 4px 12px rgb(0 0 0 / 0.10), 0 0 0 0.5px rgb(0 0 0 / 0.06)',
	lg: '0 12px 32px rgb(0 0 0 / 0.16), 0 0 0 0.5px rgb(0 0 0 / 0.08)',
	overlay: '0 24px 64px rgb(0 0 0 / 0.28), 0 0 0 0.5px rgb(0 0 0 / 0.10)',
	focus: '0 0 0 3px var(--slate-accent-muted)',
} as const;

/**
 * Motion.
 *
 * The easing curve is the important part: a strong ease-out with no overshoot
 * is what makes an interface feel responsive rather than animated. Nothing in
 * this suite bounces.
 */
export const MOTION = {
	duration: {
		instant: '0ms',
		fast: '120ms',
		normal: '160ms',
		slow: '220ms',
		slower: '320ms',
	},
	ease: {
		standard: 'cubic-bezier(0.32, 0.72, 0, 1)',
		out: 'cubic-bezier(0.16, 1, 0.3, 1)',
		in: 'cubic-bezier(0.4, 0, 1, 1)',
		linear: 'linear',
	},
} as const;

/**
 * Fixed chrome dimensions.
 *
 * Shared by the CSS and by the Rust side's window sizing, so the two cannot
 * disagree about how tall a title bar is.
 */
export const CHROME = {
	titlebarHeight: '34px',
	statusbarHeight: '24px',
	trafficLightSize: '12px',
	trafficLightGap: '8px',
	sidebarWidth: '240px',
	/**
	 * Square, not rounded. The window is built `transparent(true)` so a
	 * rounded corner has somewhere to reveal — but WebView2 does not reliably
	 * punch a transparent hole in its own corners, so the area outside a
	 * rounded `AppShell` can render as an opaque white square instead of
	 * see-through, which reads as a rendering bug rather than a design
	 * choice. A square window has no such gap.
	 */
	windowRadius: '0px',

	/** Menus: the context menus, and the tray popup that reuses their shape. */
	menuMinWidth: '208px',
	menuItemHeight: '30px',
	menuRadius: '10px',
	menuPadding: '4px',
} as const;

/** Stacking order. Centralised so two overlays cannot fight over a value. */
export const LAYER = {
	base: '0',
	raised: '10',
	sticky: '20',
	titlebar: '30',
	dropdown: '40',
	overlay: '50',
	modal: '60',
	toast: '70',
	tooltip: '80',
} as const;
