/**
 * WCAG contrast gates for the Nord palette.
 *
 * Nord was drawn for syntax highlighting, not for interface chrome, and
 * several of its colours fail as UI text — `nord3` on `nord0` is 1.6:1. The
 * palette therefore carries a few derived values, and the whole point of
 * deriving them is that they clear contrast. Without a gate, that claim decays
 * the first time somebody nudges a hex "to warm it up a bit".
 *
 * These are assertions about the palette, not about any component: they pin
 * the pairings the design system promises are legible.
 */

import { describe, expect, test } from 'bun:test';

import { type ColorRole, SEMANTIC_COLORS, type ThemeName } from '../src/tokens/color.tokens.ts';

/** WCAG 2.1 AA, normal-size text. */
const AA_TEXT = 4.5;
/** WCAG 2.1 AA, non-text: focus rings, control boundaries, status dots. */
const AA_NON_TEXT = 3;

type Rgb = { r: number; g: number; b: number; a: number };

/** Parses `#rgb`, `#rrggbb`, and `#rrggbbaa`. */
function parseHex(value: string): Rgb {
	const hex = value.replace('#', '');
	const expanded = hex.length === 3 ? [...hex].map((char) => char + char).join('') : hex;
	const channel = (at: number) => Number.parseInt(expanded.slice(at, at + 2), 16);

	return {
		r: channel(0),
		g: channel(2),
		b: channel(4),
		a: expanded.length === 8 ? channel(6) / 255 : 1,
	};
}

/**
 * Flattens a translucent colour onto an opaque one.
 *
 * The palette leans on alpha deliberately, so a check that ignored it would be
 * measuring a colour that never actually reaches the screen.
 */
function composite(over: Rgb, under: Rgb): Rgb {
	return {
		r: over.r * over.a + under.r * (1 - over.a),
		g: over.g * over.a + under.g * (1 - over.a),
		b: over.b * over.a + under.b * (1 - over.a),
		a: 1,
	};
}

/** WCAG relative luminance. */
function luminance({ r, g, b }: Rgb): number {
	const channel = (value: number) => {
		const srgb = value / 255;
		return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
	};

	return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** The WCAG contrast ratio between a foreground and an opaque background. */
export function contrastRatio(foreground: string, background: string): number {
	const under = parseHex(background);
	const over = composite(parseHex(foreground), under);
	const overLuminance = luminance(over);
	const underLuminance = luminance(under);
	const lighter = Math.max(overLuminance, underLuminance);
	const darker = Math.min(overLuminance, underLuminance);

	return (lighter + 0.05) / (darker + 0.05);
}

/** Every surface text is allowed to sit on. */
const SURFACES: ColorRole[] = ['bg-canvas', 'bg-surface', 'bg-elevated', 'bg-menu'];

/**
 * The surfaces a status colour is actually rendered on: the status bar
 * (`bg-surface`), a menu item's danger tone (`bg-menu`), and inline text on the
 * canvas.
 *
 * Deliberately not `bg-elevated`. Nothing renders status text on a card, and
 * holding `nord2` to that bar would force the palette's red light enough to
 * stop reading as Nord at all.
 */
const STATUS_SURFACES: ColorRole[] = ['bg-canvas', 'bg-surface', 'bg-menu'];

const BODY_TEXT: ColorRole[] = ['text-primary', 'text-secondary', 'text-tertiary'];

const STATUS: ColorRole[] = ['status-success', 'status-warning', 'status-danger', 'status-info'];

const TRAFFIC_LIGHTS: ColorRole[] = ['chrome-close', 'chrome-minimize', 'chrome-zoom'];

const THEMES: ThemeName[] = ['dark', 'light'];

for (const theme of THEMES) {
	describe(`${theme} theme`, () => {
		const colors = SEMANTIC_COLORS[theme];

		for (const surface of SURFACES) {
			for (const role of BODY_TEXT) {
				test(`${role} meets AA on ${surface}`, () => {
					expect(contrastRatio(colors[role], colors[surface])).toBeGreaterThanOrEqual(AA_TEXT);
				});
			}

			test(`the focus ring is visible against ${surface}`, () => {
				expect(contrastRatio(colors['border-focus'], colors[surface])).toBeGreaterThanOrEqual(
					AA_NON_TEXT,
				);
			});
		}

		for (const surface of STATUS_SURFACES) {
			for (const role of STATUS) {
				test(`${role} meets AA on ${surface}`, () => {
					expect(contrastRatio(colors[role], colors[surface])).toBeGreaterThanOrEqual(AA_TEXT);
				});
			}
		}

		test('text on a filled accent meets AA', () => {
			expect(
				contrastRatio(colors['text-on-accent'], colors['accent-default']),
			).toBeGreaterThanOrEqual(AA_TEXT);
		});

		test('text on a filled accent stays legible through the hover state', () => {
			expect(
				contrastRatio(colors['text-on-accent'], colors['accent-hover']),
			).toBeGreaterThanOrEqual(AA_TEXT);
		});

		test('text on a filled destructive control meets AA', () => {
			// The danger red serves as both ink and fill, so it has to clear the
			// surfaces behind it *and* carry its own foreground.
			expect(
				contrastRatio(colors['text-on-danger'], colors['status-danger']),
			).toBeGreaterThanOrEqual(AA_TEXT);
		});

		test('a filled destructive control is distinguishable from the canvas', () => {
			expect(contrastRatio(colors['status-danger'], colors['bg-canvas'])).toBeGreaterThanOrEqual(
				AA_NON_TEXT,
			);
		});

		test('a filled accent is distinguishable from the canvas behind it', () => {
			expect(contrastRatio(colors['accent-default'], colors['bg-canvas'])).toBeGreaterThanOrEqual(
				AA_NON_TEXT,
			);
		});

		test('inverted text is legible on the primary text colour', () => {
			// Used by anything that flips the two, such as a tooltip.
			expect(contrastRatio(colors['text-inverted'], colors['text-primary'])).toBeGreaterThanOrEqual(
				AA_TEXT,
			);
		});

		for (const light of TRAFFIC_LIGHTS) {
			test(`the ${light} traffic light carries its glyph legibly`, () => {
				// The glyph appears on hover, and the dot is the one place a
				// mid-tone Aurora is a background rather than ink.
				expect(contrastRatio(colors['chrome-glyph'], colors[light])).toBeGreaterThanOrEqual(
					AA_NON_TEXT,
				);
			});
		}

		test('a drained traffic light is still visible against the title bar', () => {
			// Only has to be perceptible, not legible: the control is labelled,
			// and desaturating it is the point (ADR 0010).
			expect(contrastRatio(colors['chrome-inactive'], colors['bg-surface'])).toBeGreaterThanOrEqual(
				1.3,
			);
		});
	});
}

describe('the ratio calculation itself', () => {
	test('black on white is the maximum 21:1', () => {
		expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
	});

	test('a colour against itself is 1:1', () => {
		expect(contrastRatio('#2e3440', '#2e3440')).toBeCloseTo(1, 5);
	});

	test('alpha is composited rather than ignored', () => {
		// Fully transparent ink cannot contrast with anything.
		expect(contrastRatio('#ffffff00', '#2e3440')).toBeCloseTo(1, 5);
	});

	test('shorthand hex expands', () => {
		expect(contrastRatio('#fff', '#000')).toBeCloseTo(21, 1);
	});
});
