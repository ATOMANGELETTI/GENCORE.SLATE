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
	 * Two faces from one superfamily, each doing the job it was drawn for.
	 *
	 * `sans` is Fira Sans and sets anything read as **language**: labels, app
	 * names, headings, prose. `mono` is Fira Code and sets anything read as a
	 * **value**: a version, a count, a byte size, a path, a slash command.
	 * Sharing a skeleton is what lets the two sit on the same row without the
	 * seam showing.
	 *
	 * This replaced Terminess, which had been carrying both jobs. Terminess is
	 * a monospace used as an interface face, and at 13px in a dense list that
	 * costs more legibility than the technical character it buys; moving the
	 * monospace to the values keeps that character exactly where it earns its
	 * keep. ADR 0014 records the decision and supersedes ADR 0013.
	 *
	 * Both ship as WOFF2 inside `@slate/ui-kit`; the fallbacks exist only for
	 * the moment before the files land.
	 */
	family: {
		sans: "'Fira Sans', system-ui, 'Segoe UI', sans-serif",
		mono: "'Fira Code', 'Fira Mono', ui-monospace, 'Cascadia Code', Consolas, monospace",
	},
	/**
	 * `base` is 13px, the size the chrome is actually set in — the same size
	 * `.agents/rules/06-design-system.md` has always specified for the title
	 * bar.
	 *
	 * The scale no longer snaps to even values. That constraint existed because
	 * Terminus was drawn as a bitmap face and an odd size landed its stems
	 * between pixels; an outline face hinted for the screen has no such
	 * problem, and forbidding 13px was forbidding the one size a dense desktop
	 * list most wants.
	 */
	size: {
		'2xs': '10px',
		xs: '11px',
		sm: '12px',
		base: '13px',
		md: '16px',
		lg: '18px',
		xl: '20px',
		'2xl': '28px',
	},
	/**
	 * Four weights, because hierarchy is carried by weight rather than by boxes
	 * and borders.
	 *
	 * Terminess had 400 and 700 and nothing between, which is why so much of
	 * the chrome was set bold when it only wanted emphasis. `medium` is the
	 * default for anything emphasised inside a row; `semibold` is for a heading
	 * or a wordmark; `bold` is rare and deliberate.
	 */
	weight: {
		regular: '400',
		medium: '500',
		semibold: '600',
		bold: '700',
	},
	leading: {
		tight: '1.25',
		normal: '1.45',
		relaxed: '1.65',
	},
	/**
	 * Uppercase labelling is the suite's house style, and uppercase costs
	 * legibility — the word shape a reader normally recognises is gone, so the
	 * letters have to be separated to be read individually. `wide` buys that
	 * back at 12px and above, `wider` below it, `widest` for a banded header
	 * where the label is doing structural work. None of them is decoration:
	 * setting uppercase without tracking is the mistake they exist to prevent.
	 */
	tracking: {
		tight: '-0.01em',
		normal: '0',
		wide: '0.02em',
		wider: '0.06em',
		widest: '0.14em',
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
	 * Square, not rounded. The window is built `transparent(true)` so a rounded
	 * corner has somewhere to reveal — but WebView2 does not reliably punch a
	 * transparent hole in its own corners, so the area outside a rounded
	 * `AppShell` can render as an opaque white square instead of see-through,
	 * which reads as a rendering bug rather than a design choice. A square
	 * window has no such gap.
	 */
	windowRadius: '0px',

	/** The Launcher's identity, folders and actions column. */
	railWidth: '180px',
	/** An expanded view's own menu, which stands where the app list was. */
	viewNavWidth: '172px',
	/**
	 * How much wider the window becomes when a view opens.
	 *
	 * Shared with the Rust command that performs the resize, so the frontend's
	 * layout and the window's actual width cannot disagree about it.
	 */
	windowExpansion: '180px',
	/** The command bar's prompt line, and the argument hints beneath it. */
	commandBarHeight: '40px',
	commandHintsHeight: '30px',

	/** Menus: the context menus, and the tray popup that reuses their shape. */
	menuMinWidth: '208px',
	menuItemHeight: '30px',
	menuRadius: '10px',
	menuPadding: '4px',
} as const;

/**
 * Row density, as a user setting.
 *
 * These are the only dimensions that change between the two modes, and they are
 * deliberately few: a density that altered font sizes as well as heights would
 * stop being one setting and become a second design. Applied as
 * `data-density="compact"` on the root element — the same mechanism the theme
 * uses — so a component reads `var(--slate-density-row)` and never learns which
 * mode is active.
 */
export const DENSITY = {
	comfortable: {
		row: '34px',
		navRow: '30px',
		sectionGap: '16px',
	},
	compact: {
		row: '28px',
		navRow: '26px',
		sectionGap: '10px',
	},
} as const;

/** The density modes the suite ships. */
export type DensityName = keyof typeof DENSITY;

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
