/**
 * Colour tokens, built on the official Nord palette.
 *
 * Two layers, and the distinction matters:
 *
 * - {@link NORD} is raw material. Components never reference it.
 * - **Semantic** tokens name a role — `bg.surface`, `text.secondary` — and are
 *   the only thing components use. Changing what "surface" means then changes
 *   every surface at once, which is the entire reason a design system exists.
 *
 * Nord splits into four groups, and the suite uses each for what it was drawn
 * for: **Polar Night** is the dark theme's background ladder, **Snow Storm** is
 * the light theme's, **Frost** is the interactive accent, and **Aurora**
 * carries status meaning.
 *
 * # Why some values here are not literally a Nord colour
 *
 * Nord is sixteen colours designed for syntax highlighting, not a complete UI
 * system, so a handful of roles have no Nord answer. The most consequential is
 * `nord3` on `nord0`, which is **1.6:1** — Nord uses it for source-code
 * comments, and it fails badly as interface text. Every role without a Nord
 * answer is therefore an **alpha tint of an official colour**, never a new hue:
 * a translucent `nord4` reads correctly on every Polar Night surface at once,
 * whereas a fixed grey only looks right on the one surface it was picked for.
 *
 * The light theme's Aurora and Frost values are the exception — a translucent
 * status colour is not legible — so those are the official hue darkened in HSL,
 * which preserves the hue and saturation that make them recognisable.
 *
 * Every pairing below is asserted against WCAG AA by
 * `packages/slate-tokens/tests/contrast.test.ts`. Change a value here and that
 * test tells you what it broke.
 *
 * @see https://www.nordtheme.com
 */

/** The official Nord palette, exact. Never referenced by a component. */
export const NORD = {
	// Polar Night — the dark theme's backgrounds.
	nord0: '#2e3440',
	nord1: '#3b4252',
	nord2: '#434c5e',
	nord3: '#4c566a',

	// Snow Storm — the light theme's backgrounds, the dark theme's text.
	nord4: '#d8dee9',
	nord5: '#e5e9f0',
	nord6: '#eceff4',

	// Frost — the interactive accent.
	nord7: '#8fbcbb',
	nord8: '#88c0d0',
	nord9: '#81a1c1',
	nord10: '#5e81ac',

	// Aurora — status, and the traffic lights.
	nord11: '#bf616a',
	nord12: '#d08770',
	nord13: '#ebcb8b',
	nord14: '#a3be8c',
	nord15: '#b48ead',
} as const;

/**
 * Values Nord does not supply, derived from values it does.
 *
 * Each records what it comes from and why the official colour cannot be used
 * directly. Nothing here invents a hue.
 */
const DERIVED = {
	/**
	 * `nord11` lightened in HSL at its own saturation, until it clears 4.5:1
	 * on `nord1`. Pure `nord11` is **2.46:1** there and 2.87:1 even on
	 * `nord0` — it fails as text on every Polar Night surface, so a dark
	 * theme cannot use it for a danger label. For comparison, GitHub dark's
	 * error red manages 3.99:1 here and VS Code's 4.10:1; both are lightened
	 * from their palette's base red for exactly this reason.
	 *
	 * Saturation is raised at the same time, because lightening alone drains
	 * it to pink; this keeps it reading as red at the lightness AA forces.
	 *
	 * The value doubles as the **fill** of a destructive control in the dark
	 * theme, carrying `nord0` as its foreground — the same inversion the accent
	 * uses. A dark red fill is impossible here: clearing 3:1 against `nord0`
	 * needs a light colour, and carrying light text needs a dark one.
	 *
	 * The traffic light keeps the pure `nord11`, because there the colour is a
	 * fill carrying a dark glyph rather than ink.
	 */
	auroraRedLight: '#ea9aa2',

	/**
	 * Aurora darkened in HSL until each clears 4.5:1 on `nord4`. Aurora was
	 * drawn against Polar Night; on Snow Storm every one of them fails as text.
	 *
	 * `auroraRedDeep` is also the **fill** of a destructive control in the
	 * light theme, carrying `nord6`.
	 */
	auroraRedDeep: '#a3424b',
	auroraYellowDeep: '#7e5b16',
	auroraGreenDeep: '#50683b',
	frostBlueDeep: '#306879',

	/**
	 * `nord4` at 80%. Composites to at least 4.7:1 on every Polar Night
	 * surface, where `nord3` — Nord's own choice for this role — manages
	 * 1.6:1. 70% was tried first and reaches only 4.06:1 on `nord2`.
	 */
	snowMuted: '#d8dee9cc',
	/**
	 * The traffic lights' inactive grey in the light theme: one step down from
	 * `nord4`, so a drained light reads as drained rather than as one more
	 * surface.
	 */
	chromeInactiveLight: '#c4cddb',
} as const;

/**
 * The accents a user may choose between, resolved per theme.
 *
 * The accent is a setting, which makes it the one colour in the system a user
 * can get wrong — so the set is closed, drawn entirely from Frost, and every
 * member is asserted against AA by the contrast test in both themes. A picker
 * that let someone select an unreadable accent would be a way to break your own
 * interface from inside the preferences.
 *
 * Only three, from `nord7`, `nord8` and `nord9`. `nord10` was tried and dropped:
 * once each theme's derivation has run, it lands within a couple of percent of
 * `nord9` in both, and two swatches a user cannot tell apart are worse than
 * three they can.
 *
 * The derivations follow the same rule as everything else here. In the dark
 * theme the accent is a **light fill carrying `nord0`**, so anything too dark
 * for that ink is lightened; in the light theme it is a **dark fill carrying
 * `nord6`**, so anything too light is darkened. `hover` moves away from the
 * foreground in both — lighter in dark, darker in light — because a hover that
 * moved toward it would drop the fill's own text below AA halfway through the
 * transition.
 */
export const ACCENTS = {
	dark: {
		/** `nord7`, unmodified: 5.99:1 against `nord0`. */
		teal: { default: NORD.nord7, hover: '#a2c7c7', muted: '#8fbcbb33' },
		/** `nord8`, unmodified: 6.24:1. The suite's default. */
		cyan: { default: NORD.nord8, hover: '#9eccd9', muted: '#88c0d033' },
		/** `nord9` lightened one step, from 4.64:1 to 4.71:1 — margin, not repair. */
		blue: { default: '#83a2c2', hover: '#98b1cc', muted: '#83a2c233' },
	},
	light: {
		/** `nord7` darkened until `nord6` on it clears 4.7:1. */
		teal: { default: '#447170', hover: '#3c6463', muted: '#44717026' },
		/** `nord8` darkened likewise. The suite's default. */
		cyan: { default: '#337082', hover: '#2d6373', muted: '#33708226' },
		/** `nord9` darkened likewise. */
		blue: { default: '#476b90', hover: '#406182', muted: '#476b9026' },
	},
} as const;

/** The accents a user may select. */
export type AccentName = keyof (typeof ACCENTS)['dark'];

/** The accents a user may select, in the order a picker should offer them. */
export const ACCENT_NAMES = ['teal', 'cyan', 'blue'] as const satisfies readonly AccentName[];

/**
 * The accent applied when the user has expressed no preference.
 *
 * `nord8` is Nord's own primary Frost colour, and it is what the suite's chrome
 * was drawn against.
 */
export const DEFAULT_ACCENT = 'cyan' satisfies AccentName;

/**
 * Semantic colour roles, resolved per theme.
 *
 * Alpha-composited borders and overlays are intentional: a hairline defined as
 * a translucent Snow Storm or Polar Night sits correctly on any surface
 * beneath it, whereas a fixed value only looks right on the one it was picked
 * for.
 *
 * The five accent-derived roles read from {@link ACCENTS} rather than repeating
 * a hex, so the default accent and the first entry in the picker cannot drift
 * apart. Those same five are what `applyAccent` overrides at runtime.
 */
export const SEMANTIC_COLORS = {
	dark: {
		'bg-canvas': NORD.nord0,
		'bg-surface': NORD.nord1,
		'bg-elevated': NORD.nord2,
		// One step above the canvas, not two. `nord2` was tried and is too
		// light to carry a muted or status label at AA, and a menu that sits
		// close to the window is what the chrome is drawn to look like anyway;
		// the hairline and the shadow are what lift it, not the fill.
		'bg-menu': NORD.nord1,
		// Nothing sits below `nord0`, so an inset is cut rather than filled.
		'bg-inset': '#00000026',
		'bg-overlay': '#2e3440cc',
		'bg-hover': '#eceff40f',
		'bg-active': '#eceff41a',
		'bg-selected': ACCENTS.dark[DEFAULT_ACCENT].muted,

		'text-primary': NORD.nord6,
		'text-secondary': NORD.nord4,
		'text-tertiary': DERIVED.snowMuted,
		'text-inverted': NORD.nord0,
		'text-on-accent': NORD.nord0,

		'border-hairline': '#d8dee91f',
		'border-strong': '#d8dee93d',
		'border-focus': ACCENTS.dark[DEFAULT_ACCENT].default,

		'accent-default': ACCENTS.dark[DEFAULT_ACCENT].default,
		'accent-hover': ACCENTS.dark[DEFAULT_ACCENT].hover,
		'accent-muted': ACCENTS.dark[DEFAULT_ACCENT].muted,

		'status-success': NORD.nord14,
		'status-warning': NORD.nord13,
		'status-danger': DERIVED.auroraRedLight,
		// Dark, like `text-on-accent`: the dark theme's fills are the light
		// end of the palette, so their foregrounds are the dark end.
		'text-on-danger': NORD.nord0,
		// Deliberately a fixed `nord8` rather than the chosen accent. Status
		// means something; an informational marker that changed hue with a
		// preference would stop being a signal and become decoration.
		'status-info': NORD.nord8,

		// Aurora, not macOS red/amber/green: a `#ff5f57` dot in a Nord window
		// is the fastest way to make the whole thing look unfinished. ADR 0010
		// fixes the placement and the focus behaviour, not the hue.
		'chrome-close': NORD.nord11,
		'chrome-minimize': NORD.nord13,
		'chrome-zoom': NORD.nord14,
		'chrome-inactive': NORD.nord3,
		'chrome-glyph': NORD.nord0,
	},
	light: {
		'bg-canvas': NORD.nord4,
		'bg-surface': NORD.nord5,
		'bg-elevated': NORD.nord6,
		'bg-menu': NORD.nord6,
		'bg-inset': '#2e344014',
		'bg-overlay': '#2e344066',
		'bg-hover': '#2e34400f',
		'bg-active': '#2e34401a',
		'bg-selected': ACCENTS.light[DEFAULT_ACCENT].muted,

		'text-primary': NORD.nord0,
		'text-secondary': NORD.nord2,
		'text-tertiary': NORD.nord3,
		'text-inverted': NORD.nord6,
		'text-on-accent': NORD.nord6,

		'border-hairline': '#2e344026',
		'border-strong': '#2e34404d',
		'border-focus': ACCENTS.light[DEFAULT_ACCENT].default,

		'accent-default': ACCENTS.light[DEFAULT_ACCENT].default,
		'accent-hover': ACCENTS.light[DEFAULT_ACCENT].hover,
		'accent-muted': ACCENTS.light[DEFAULT_ACCENT].muted,

		'status-success': DERIVED.auroraGreenDeep,
		'status-warning': DERIVED.auroraYellowDeep,
		'status-danger': DERIVED.auroraRedDeep,
		'text-on-danger': NORD.nord6,
		'status-info': DERIVED.frostBlueDeep,

		// The lights keep their Aurora hues in both themes: they are recognised
		// by colour, and re-tinting them per theme would break that.
		'chrome-close': NORD.nord11,
		'chrome-minimize': NORD.nord13,
		'chrome-zoom': NORD.nord14,
		'chrome-inactive': DERIVED.chromeInactiveLight,
		'chrome-glyph': NORD.nord0,
	},
} as const;

/** The colour roles a component may reference. */
export type ColorRole = keyof (typeof SEMANTIC_COLORS)['dark'];

/** The themes the suite ships. */
export type ThemeName = keyof typeof SEMANTIC_COLORS;

/**
 * The roles that follow the chosen accent.
 *
 * Listed once, here, because `applyAccent` and the contrast test both need to
 * agree on exactly which roles move — and a role that moved in one but not the
 * other would be a preference that silently broke a ratio.
 */
export const ACCENT_DRIVEN_ROLES = [
	'accent-default',
	'accent-hover',
	'accent-muted',
	'bg-selected',
	'border-focus',
] as const satisfies readonly ColorRole[];
