/**
 * Turns the token definitions into the CSS the whole suite consumes.
 *
 * The output has two parts:
 *
 * 1. `:root` custom properties, redefined under `[data-theme='light']` — the
 *    values every component reads.
 * 2. A Tailwind v4 `@theme` block that maps those same custom properties to
 *    utility names, so `bg-surface` and `text-secondary` exist as classes.
 *
 * Because both halves come from one source, a token cannot exist as a utility
 * without existing as a variable, or drift from it.
 */

import {
	ACCENT_NAMES,
	ACCENTS,
	type AccentName,
	SEMANTIC_COLORS,
	type ThemeName,
} from '../tokens/color.tokens.ts';
import {
	CHROME,
	DENSITY,
	LAYER,
	MOTION,
	RADIUS,
	SHADOW,
	SPACE,
	TYPOGRAPHY,
} from '../tokens/layout.tokens.ts';

const BANNER = `/*
 * GENERATED FILE — DO NOT EDIT.
 *
 * Source: packages/slate-tokens/src/tokens/
 * Regenerate: moon run slate-tokens:build
 */`;

/** Prefix for every custom property the suite defines. */
export const TOKEN_PREFIX = '--slate';

function declarations(entries: Record<string, string>, prefix: string, indent = '\t'): string {
	return Object.entries(entries)
		.map(([name, value]) => `${indent}${TOKEN_PREFIX}-${prefix}-${name}: ${value};`)
		.join('\n');
}

/**
 * The Tailwind colour name a semantic role maps to.
 *
 * Tailwind builds a utility as `<property>-<colour name>`, so a role that
 * already carries its category — `bg-surface` — would otherwise produce
 * `bg-bg-surface`, and the obvious `bg-surface` would silently resolve to
 * nothing at all. Tailwind emits no error for an unknown utility, so the class
 * simply does not exist and the element keeps whatever it inherited: the exact
 * failure that left `text-on-accent` rendering light text on a light accent
 * button while looking, in the source, entirely correct.
 *
 * Stripping the category is what makes the class names every component already
 * writes — `bg-surface`, `text-secondary`, `border-hairline` — resolve. Roles
 * with no category prefix (`accent-default`, `status-danger`) pass through
 * unchanged, which is why those were the only ones that ever worked.
 *
 * The `--slate-*` custom properties keep their full role name, so anything
 * reading `var(--slate-bg-surface)` directly is unaffected.
 */
function utilityName(role: string): string {
	return role.replace(/^(?:bg|text|border)-/, '');
}

function themeBlock(theme: ThemeName): string {
	return Object.entries(SEMANTIC_COLORS[theme])
		.map(([role, value]) => `\t${TOKEN_PREFIX}-${role}: ${value};`)
		.join('\n');
}

/**
 * The five roles a chosen accent moves, for one theme.
 *
 * `bg-selected` and `border-focus` are in here deliberately: a selected row and
 * a focus ring are the accent doing its job, and leaving either behind on the
 * default would make a changed accent look like a half-finished setting.
 */
function accentBlock(theme: ThemeName, accent: AccentName): string {
	const { default: base, hover, muted } = ACCENTS[theme][accent];

	return [
		`\t${TOKEN_PREFIX}-accent-default: ${base};`,
		`\t${TOKEN_PREFIX}-accent-hover: ${hover};`,
		`\t${TOKEN_PREFIX}-accent-muted: ${muted};`,
		`\t${TOKEN_PREFIX}-bg-selected: ${muted};`,
		`\t${TOKEN_PREFIX}-border-focus: ${base};`,
	].join('\n');
}

/**
 * Every accent, in both themes, as CSS.
 *
 * Emitted as selectors rather than applied inline by script. An inline override
 * would freeze one theme's value onto the root element, and then go wrong the
 * moment the window followed the system preference into the other theme — the
 * accent would keep a dark-theme fill on a light background and stop clearing
 * contrast. Selectors let the cascade resolve theme and accent together.
 *
 * Order and specificity matter and are load-bearing. The dark blocks are one
 * attribute, so they beat `:root`; the light blocks are two, so they beat both;
 * and the media-query blocks add `:root:not(…)` so they beat the light blocks
 * they follow.
 *
 * Each light rule is written twice — once compound, once as a descendant. The
 * compound form is the normal case, where the theme and the accent are both on
 * the root element. The descendant form is what lets `data-accent` be used as a
 * **scope** further down the tree: the accent picker paints each swatch by
 * putting `data-accent` on the swatch itself, so a colour is never written in a
 * component and the picker cannot drift from what it picks. Without the
 * descendant form that swatch would keep its dark value on a light window,
 * which is the one place the mistake would be most visible.
 */
function accentBlocks(): string[] {
	return [
		'/* ── Accent, as a user setting ──────────────────────────────────────── */',
		...ACCENT_NAMES.flatMap((accent) => [
			`[data-accent='${accent}'] {`,
			accentBlock('dark', accent),
			'}',
			'',
		]),
		...ACCENT_NAMES.flatMap((accent) => [
			`[data-theme='light'][data-accent='${accent}'],`,
			`[data-theme='light'] [data-accent='${accent}'] {`,
			accentBlock('light', accent),
			'}',
			'',
		]),
		'@media (prefers-color-scheme: light) {',
		...ACCENT_NAMES.flatMap((accent) => [
			`\t:root:not([data-theme='dark'])[data-accent='${accent}'],`,
			`\t:root:not([data-theme='dark']) [data-accent='${accent}'] {`,
			accentBlock('light', accent).replace(/^\t/gm, '\t\t'),
			'\t}',
		]),
		'}',
	];
}

/** Renders the complete stylesheet. */
export function generateTokensCss(): string {
	const sections = [
		BANNER,
		'',
		'@import "tailwindcss";',
		'',
		'/* ── Dark is the default theme (ADR 0010) ───────────────────────────── */',
		':root {',
		themeBlock('dark'),
		'',
		declarations(SPACE, 'space'),
		'',
		declarations(RADIUS, 'radius'),
		'',
		declarations(TYPOGRAPHY.family, 'font'),
		declarations(TYPOGRAPHY.size, 'text'),
		declarations(TYPOGRAPHY.weight, 'weight'),
		declarations(TYPOGRAPHY.leading, 'leading'),
		declarations(TYPOGRAPHY.tracking, 'tracking'),
		'',
		declarations(SHADOW, 'shadow'),
		'',
		declarations(MOTION.duration, 'duration'),
		declarations(MOTION.ease, 'ease'),
		'',
		declarations(CHROME, 'chrome'),
		declarations(LAYER, 'layer'),
		'',
		declarations(DENSITY.comfortable, 'density'),
		'}',
		'',
		'/* An explicit choice wins over the system preference in both directions. */',
		"[data-theme='light'] {",
		themeBlock('light'),
		'}',
		'',
		'/* Row density, as a user setting. Only the heights move — see DENSITY. */',
		"[data-density='compact'] {",
		declarations(DENSITY.compact, 'density'),
		'}',
		'',
		'@media (prefers-color-scheme: light) {',
		"\t:root:not([data-theme='dark']) {",
		themeBlock('light').replace(/^\t/gm, '\t\t'),
		'\t}',
		'}',
		'',
		...accentBlocks(),
		'',
		'/* ── Tailwind v4 utilities, mapped to the variables above ───────────── */',
		'@theme inline {',
		...Object.keys(SEMANTIC_COLORS.dark).map(
			(role) => `\t--color-${utilityName(role)}: var(${TOKEN_PREFIX}-${role});`,
		),
		...Object.keys(SPACE).map((key) => `\t--spacing-${key}: var(${TOKEN_PREFIX}-space-${key});`),
		...Object.keys(RADIUS).map((key) => `\t--radius-${key}: var(${TOKEN_PREFIX}-radius-${key});`),
		...Object.keys(TYPOGRAPHY.size).map(
			(key) => `\t--text-${key}: var(${TOKEN_PREFIX}-text-${key});`,
		),
		...Object.keys(TYPOGRAPHY.family).map(
			(key) => `\t--font-${key}: var(${TOKEN_PREFIX}-font-${key});`,
		),
		// Weight, tracking and leading were previously declared as custom
		// properties but never mapped here, so `font-bold` and `tracking-tight`
		// in a component silently resolved to Tailwind's own defaults rather
		// than to the token beside them. That was survivable while the scale
		// happened to agree; it stopped being survivable the moment tracking
		// became load-bearing for uppercase labels.
		...Object.keys(TYPOGRAPHY.weight).map(
			(key) => `\t--font-weight-${key}: var(${TOKEN_PREFIX}-weight-${key});`,
		),
		...Object.keys(TYPOGRAPHY.tracking).map(
			(key) => `\t--tracking-${key}: var(${TOKEN_PREFIX}-tracking-${key});`,
		),
		...Object.keys(TYPOGRAPHY.leading).map(
			(key) => `\t--leading-${key}: var(${TOKEN_PREFIX}-leading-${key});`,
		),
		...Object.keys(SHADOW).map((key) => `\t--shadow-${key}: var(${TOKEN_PREFIX}-shadow-${key});`),
		...Object.keys(MOTION.ease).map((key) => `\t--ease-${key}: var(${TOKEN_PREFIX}-ease-${key});`),
		'}',
		'',
		'/* ── Base layer ─────────────────────────────────────────────────────── */',
		'@layer base {',
		'\t* {',
		'\t\tborder-color: var(--slate-border-hairline);',
		'\t}',
		'',
		'\thtml,',
		'\tbody,',
		'\t#root {',
		'\t\theight: 100%;',
		'\t\tmargin: 0;',
		'\t}',
		'',
		'\tbody {',
		'\t\t/* Transparent, not the canvas colour. Every window is built with',
		'\t\t   `transparent` and `decorations(false)`, so the frame is drawn by',
		"\t\t   `AppShell`, and the compositor's own drop shadow is what separates",
		'\t\t   the window from the desktop — an opaque body would paint a hard',
		'\t\t   edge behind that shadow instead of letting it fade. A page that',
		'\t\t   needs a ground of its own, such as the component gallery, sets',
		'\t\t   `bg-canvas` on its own root. */',
		'\t\tbackground-color: transparent;',
		'\t\tcolor: var(--slate-text-primary);',
		'\t\tfont-family: var(--slate-font-sans);',
		'\t\tfont-size: var(--slate-text-base);',
		'\t\tline-height: var(--slate-leading-normal);',
		'\t\t-webkit-font-smoothing: antialiased;',
		'\t\ttext-rendering: optimizeLegibility;',
		'\t}',
		'',
		'\t/* A desktop window is not a document: it must never rubber-band or',
		'\t   offer text selection on chrome the way a web page does. */',
		'\tbody {',
		'\t\toverflow: hidden;',
		'\t\toverscroll-behavior: none;',
		'\t\tcursor: default;',
		'\t\tuser-select: none;',
		'\t}',
		'',
		'\tinput,',
		'\ttextarea,',
		'\t[contenteditable],',
		'\t[data-selectable] {',
		'\t\tuser-select: text;',
		'\t\tcursor: text;',
		'\t}',
		'',
		'\t:focus-visible {',
		'\t\toutline: 2px solid var(--slate-border-focus);',
		'\t\toutline-offset: 2px;',
		'\t}',
		'',
		'\t::selection {',
		'\t\tbackground-color: var(--slate-accent-muted);',
		'\t}',
		'',
		'\t::-webkit-scrollbar {',
		'\t\twidth: 10px;',
		'\t\theight: 10px;',
		'\t}',
		'',
		'\t::-webkit-scrollbar-thumb {',
		'\t\tbackground-color: var(--slate-border-strong);',
		'\t\tborder: 3px solid transparent;',
		'\t\tborder-radius: var(--slate-radius-full);',
		'\t\tbackground-clip: content-box;',
		'\t}',
		'',
		'\t::-webkit-scrollbar-track {',
		'\t\tbackground: transparent;',
		'\t}',
		'',
		'	/* The one entrance in the suite: menus and the tray popup. Opacity plus',
		'	   a very slight scale — no movement, no overshoot. Declared here because',
		'	   motion is a token, not a component detail. */',
		'	@keyframes slate-menu-in {',
		'		from {',
		'			opacity: 0;',
		'			transform: scale(0.96);',
		'		}',
		'		to {',
		'			opacity: 1;',
		'			transform: scale(1);',
		'		}',
		'	}',
		'',
		'\t/* Honour the accessibility setting rather than merely shortening. */',
		'\t@media (prefers-reduced-motion: reduce) {',
		'\t\t*,',
		'\t\t*::before,',
		'\t\t*::after {',
		'\t\t\tanimation-duration: 0.01ms !important;',
		'\t\t\tanimation-iteration-count: 1 !important;',
		'\t\t\ttransition-duration: 0.01ms !important;',
		'\t\t\tscroll-behavior: auto !important;',
		'\t\t}',
		'',
		'		/* Collapse the menu entrance to opacity alone. Shortening a scale',
		'		   still moves, and the movement is the part that causes trouble. */',
		'		@keyframes slate-menu-in {',
		'			from {',
		'				opacity: 0;',
		'			}',
		'			to {',
		'				opacity: 1;',
		'			}',
		'		}',
		'\t}',
		'}',
		'',
	];

	return sections.join('\n');
}
