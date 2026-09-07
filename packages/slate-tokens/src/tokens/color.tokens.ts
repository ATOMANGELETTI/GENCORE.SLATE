/**
 * Colour tokens.
 *
 * Two layers, and the distinction matters:
 *
 * - The **palette** is raw material. Components never reference it.
 * - **Semantic** tokens name a role — `bg.surface`, `text.secondary` — and are
 *   the only thing components use. Changing what "surface" means then changes
 *   every surface at once, which is the entire reason a design system exists.
 *
 * The palette is a neutral ramp with a deliberately slight blue cast, which is
 * what stops a dark interface reading as muddy brown-grey. Accent defaults to
 * the macOS system blue and is replaced at runtime by the Windows accent
 * colour when `use-system-accent` is enabled.
 */

/** Raw greys, from lightest to darkest. Never referenced by a component. */
export const NEUTRAL = {
	0: '#ffffff',
	50: '#fafafa',
	100: '#f4f4f5',
	200: '#e9e9ec',
	300: '#d9d9de',
	400: '#a8a8b0',
	500: '#79797f',
	600: '#54545a',
	700: '#3a3a40',
	800: '#28282d',
	850: '#1f1f23',
	900: '#161619',
	950: '#0e0e10',
} as const;

/** Raw accents and status hues. Never referenced by a component. */
export const PALETTE = {
	blue: '#007aff',
	blueDark: '#0a84ff',
	green: '#34c759',
	greenDark: '#30d158',
	yellow: '#ffcc00',
	yellowDark: '#ffd60a',
	red: '#ff3b30',
	redDark: '#ff453a',
	orange: '#ff9500',
} as const;

/**
 * Semantic colour roles, resolved per theme.
 *
 * Alpha-composited borders and overlays are intentional: a hairline defined as
 * a translucent white or black sits correctly on any surface beneath it,
 * whereas a fixed grey only looks right on the one surface it was picked for.
 */
export const SEMANTIC_COLORS = {
	dark: {
		'bg-canvas': NEUTRAL[950],
		'bg-surface': NEUTRAL[900],
		'bg-elevated': NEUTRAL[850],
		'bg-inset': '#00000040',
		'bg-overlay': '#000000a6',
		'bg-hover': '#ffffff0f',
		'bg-active': '#ffffff1a',
		'bg-selected': '#0a84ff26',

		'text-primary': '#f5f5f7',
		'text-secondary': '#a8a8b0',
		'text-tertiary': '#79797f',
		'text-inverted': NEUTRAL[950],
		'text-on-accent': '#ffffff',

		'border-hairline': '#ffffff14',
		'border-strong': '#ffffff26',
		'border-focus': PALETTE.blueDark,

		'accent-default': PALETTE.blueDark,
		'accent-hover': '#3395ff',
		'accent-muted': '#0a84ff33',

		'status-success': PALETTE.greenDark,
		'status-warning': PALETTE.yellowDark,
		'status-danger': PALETTE.redDark,
		'status-info': PALETTE.blueDark,

		'chrome-close': '#ff5f57',
		'chrome-minimize': '#febc2e',
		'chrome-zoom': '#28c840',
		'chrome-inactive': '#4a4a50',
		'chrome-glyph': '#00000099',
	},
	light: {
		'bg-canvas': NEUTRAL[100],
		'bg-surface': NEUTRAL[0],
		'bg-elevated': NEUTRAL[0],
		'bg-inset': '#00000008',
		'bg-overlay': '#00000040',
		'bg-hover': '#0000000a',
		'bg-active': '#00000014',
		'bg-selected': '#007aff1f',

		'text-primary': '#1d1d1f',
		'text-secondary': '#54545a',
		'text-tertiary': '#8e8e93',
		'text-inverted': NEUTRAL[0],
		'text-on-accent': '#ffffff',

		'border-hairline': '#0000001a',
		'border-strong': '#00000029',
		'border-focus': PALETTE.blue,

		'accent-default': PALETTE.blue,
		'accent-hover': '#0060df',
		'accent-muted': '#007aff26',

		'status-success': PALETTE.green,
		'status-warning': PALETTE.yellow,
		'status-danger': PALETTE.red,
		'status-info': PALETTE.blue,

		'chrome-close': '#ff5f57',
		'chrome-minimize': '#febc2e',
		'chrome-zoom': '#28c840',
		'chrome-inactive': '#d0d0d4',
		'chrome-glyph': '#00000099',
	},
} as const;

/** The colour roles a component may reference. */
export type ColorRole = keyof (typeof SEMANTIC_COLORS)['dark'];

/** The themes the suite ships. */
export type ThemeName = keyof typeof SEMANTIC_COLORS;
