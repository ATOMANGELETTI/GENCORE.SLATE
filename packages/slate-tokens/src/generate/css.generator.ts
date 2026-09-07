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

import { SEMANTIC_COLORS, type ThemeName } from '../tokens/color.tokens.ts';
import {
	CHROME,
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

function themeBlock(theme: ThemeName): string {
	return Object.entries(SEMANTIC_COLORS[theme])
		.map(([role, value]) => `\t${TOKEN_PREFIX}-${role}: ${value};`)
		.join('\n');
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
		'}',
		'',
		'/* An explicit choice wins over the system preference in both directions. */',
		"[data-theme='light'] {",
		themeBlock('light'),
		'}',
		'',
		'@media (prefers-color-scheme: light) {',
		"\t:root:not([data-theme='dark']) {",
		themeBlock('light').replace(/^\t/gm, '\t\t'),
		'\t}',
		'}',
		'',
		'/* ── Tailwind v4 utilities, mapped to the variables above ───────────── */',
		'@theme inline {',
		...Object.keys(SEMANTIC_COLORS.dark).map(
			(role) => `\t--color-${role}: var(${TOKEN_PREFIX}-${role});`,
		),
		...Object.keys(SPACE).map((key) => `\t--spacing-${key}: var(${TOKEN_PREFIX}-space-${key});`),
		...Object.keys(RADIUS).map((key) => `\t--radius-${key}: var(${TOKEN_PREFIX}-radius-${key});`),
		...Object.keys(TYPOGRAPHY.size).map(
			(key) => `\t--text-${key}: var(${TOKEN_PREFIX}-text-${key});`,
		),
		...Object.keys(TYPOGRAPHY.family).map(
			(key) => `\t--font-${key}: var(${TOKEN_PREFIX}-font-${key});`,
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
		'\t\tbackground-color: var(--slate-bg-canvas);',
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
		'\t}',
		'}',
		'',
	];

	return sections.join('\n');
}
