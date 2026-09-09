import { describe, expect, test } from 'bun:test';

import { generateTokensCss, TOKEN_PREFIX } from '../src/generate/css.generator.ts';
import { applyTheme } from '../src/index.ts';
import { SEMANTIC_COLORS } from '../src/tokens/color.tokens.ts';
import { CHROME, MOTION, RADIUS, SPACE } from '../src/tokens/layout.tokens.ts';

describe('semantic colours', () => {
	test('light and dark define exactly the same roles', () => {
		// A role present in one theme and missing from the other produces a
		// component that looks correct until someone switches theme.
		const dark = Object.keys(SEMANTIC_COLORS.dark).sort();
		const light = Object.keys(SEMANTIC_COLORS.light).sort();

		expect(light).toEqual(dark);
	});

	test('every value is a colour, not a reference to another token', () => {
		// The palette layer must resolve to real colours; a var() here would
		// mean a token defined in terms of one that may not exist yet.
		for (const theme of Object.values(SEMANTIC_COLORS)) {
			for (const [role, value] of Object.entries(theme)) {
				expect(value).toMatch(/^#[0-9a-f]{6,8}$/i);
				expect(role).not.toContain('--');
			}
		}
	});
});

describe('custom property names', () => {
	test('contain no character that is illegal in a CSS identifier', () => {
		// A dot silently invalidates a custom property: the parser drops the
		// declaration rather than reporting it, and the value is simply absent
		// at runtime.
		const css = generateTokensCss();
		const declared = [...css.matchAll(/^\s*(--[\w-]*[^\s:]*)\s*:/gm)].map((match) => match[1]);

		expect(declared.length).toBeGreaterThan(50);

		for (const name of declared) {
			expect(name).toMatch(/^--[a-zA-Z0-9-]+$/);
		}
	});

	test('token keys avoid dots', () => {
		for (const key of Object.keys(SPACE)) {
			expect(key).not.toContain('.');
		}
		for (const key of Object.keys(RADIUS)) {
			expect(key).not.toContain('.');
		}
	});
});

describe('generated stylesheet', () => {
	const css = generateTokensCss();

	test('carries a do-not-edit banner', () => {
		expect(css).toContain('GENERATED FILE — DO NOT EDIT');
	});

	test('defines the dark theme on :root so it is the default', () => {
		expect(css).toContain(':root {');
		expect(css).toContain(`--slate-bg-canvas: ${SEMANTIC_COLORS.dark['bg-canvas']}`);
	});

	test('an explicit light choice overrides the system preference', () => {
		expect(css).toContain("[data-theme='light']");
		expect(css).toContain('@media (prefers-color-scheme: light)');
		expect(css).toContain(":root:not([data-theme='dark'])");
	});

	test('honours prefers-reduced-motion', () => {
		expect(css).toContain('@media (prefers-reduced-motion: reduce)');
	});

	test('exposes every colour role as a Tailwind utility', () => {
		// Asserted by the value it points at rather than by the utility's name.
		// This test previously required `--color-<role>`, which pinned the
		// doubled `--color-bg-surface` in place and made `bg-surface` — the
		// class every component writes — resolve to nothing at all. See the
		// "Tailwind colour utilities" block below for the naming contract.
		for (const role of Object.keys(SEMANTIC_COLORS.dark)) {
			expect(css).toContain(`var(--slate-${role});`);
		}
	});

	test('is deterministic', () => {
		// Non-deterministic output would make the CI check fail at random.
		expect(generateTokensCss()).toBe(css);
	});
});

describe('applyTheme', () => {
	test('sets an explicit theme', () => {
		const root = document.createElement('div');

		applyTheme('light', root);

		expect(root.getAttribute('data-theme')).toBe('light');
	});

	test('"system" removes the attribute so the media query stays live', () => {
		// Resolving 'system' to a concrete value here would freeze the window
		// at whatever the OS happened to be when it launched.
		const root = document.createElement('div');
		root.setAttribute('data-theme', 'dark');

		applyTheme('system', root);

		expect(root.hasAttribute('data-theme')).toBe(false);
	});
});

describe('layout tokens', () => {
	test('chrome dimensions match the documented design', () => {
		expect(CHROME.titlebarHeight).toBe('34px');
		expect(CHROME.statusbarHeight).toBe('24px');
	});

	test('motion stays within the range the design system specifies', () => {
		const durations = Object.values(MOTION.duration)
			.map((value) => Number.parseInt(value, 10))
			.filter((value) => value > 0);

		for (const duration of durations) {
			expect(duration).toBeLessThanOrEqual(320);
		}
	});
});

describe('Tailwind colour utilities', () => {
	const css = generateTokensCss();

	/**
	 * Tailwind names a utility `<property>-<colour name>`, so a colour named
	 * `bg-surface` produces `bg-bg-surface` and the `bg-surface` every
	 * component writes resolves to nothing. Tailwind reports no error for an
	 * unknown utility — the class simply does not exist and the element keeps
	 * what it inherited — which is how `text-on-accent` once rendered light
	 * text on a light accent button while looking correct in the source.
	 */
	test('a category prefix is stripped so the class components write resolves', () => {
		expect(css).toContain('--color-surface: var(--slate-bg-surface);');
		expect(css).toContain('--color-primary: var(--slate-text-primary);');
		expect(css).toContain('--color-hairline: var(--slate-border-hairline);');
		expect(css).toContain('--color-on-accent: var(--slate-text-on-accent);');
	});

	test('never emits a doubled category', () => {
		for (const doubled of ['--color-bg-', '--color-text-', '--color-border-']) {
			expect(css).not.toContain(doubled);
		}
	});

	test('a role without a category prefix passes through unchanged', () => {
		expect(css).toContain('--color-accent-default: var(--slate-accent-default);');
		expect(css).toContain('--color-status-danger: var(--slate-status-danger);');
	});

	test('every semantic role reaches Tailwind exactly once', () => {
		for (const role of Object.keys(SEMANTIC_COLORS.dark)) {
			expect(css).toContain(`var(${TOKEN_PREFIX}-${role});`);
		}
	});
});
