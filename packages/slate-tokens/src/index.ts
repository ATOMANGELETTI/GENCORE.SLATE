/**
 * `@slate/tokens` — the single source of every colour, space, radius,
 * duration, and chrome dimension in the suite.
 *
 * Import the stylesheet once, at an application's entry point:
 *
 * ```ts
 * import '@slate/tokens/css';
 * ```
 *
 * Components then use the Tailwind utilities the stylesheet defines
 * (`bg-surface`, `text-secondary`, `rounded-lg`) and never a literal value.
 *
 * The TypeScript exports below exist for the rare case where a value is needed
 * in code — a canvas colour, a computed animation duration. Reach for the CSS
 * first; a token read in TypeScript cannot respond to a theme change.
 *
 * The three `apply*` functions are the exception, and they all work the same
 * way: they set a data attribute on the root element and let the cascade
 * resolve the rest. None of them writes a colour or a dimension directly,
 * because a value written by script cannot respond to the *other* settings —
 * an accent applied as an inline colour would keep its dark-theme value when
 * the system switched to light.
 */

export { generateTokensCss, TOKEN_PREFIX } from './generate/css.generator.ts';
export {
	ACCENT_DRIVEN_ROLES,
	ACCENT_NAMES,
	ACCENTS,
	type AccentName,
	type ColorRole,
	DEFAULT_ACCENT,
	NORD,
	SEMANTIC_COLORS,
	type ThemeName,
} from './tokens/color.tokens.ts';
export {
	CHROME,
	DENSITY,
	type DensityName,
	LAYER,
	MOTION,
	RADIUS,
	SHADOW,
	SPACE,
	TYPOGRAPHY,
} from './tokens/layout.tokens.ts';

import { type AccentName, DEFAULT_ACCENT } from './tokens/color.tokens.ts';
import type { DensityName } from './tokens/layout.tokens.ts';

/** The themes the suite ships. Mirrors `slate_config::ThemeMode`. */
export const THEMES = ['dark', 'light'] as const;

/** A theme preference, including following the operating system. */
export type ThemePreference = (typeof THEMES)[number] | 'system';

/**
 * Applies a theme to the document.
 *
 * `'system'` removes the attribute entirely rather than resolving it to a
 * concrete value, so the `prefers-color-scheme` media query in the stylesheet
 * stays live and the window follows the OS as the user changes it.
 */
export function applyTheme(preference: ThemePreference, root: HTMLElement): void {
	if (preference === 'system') {
		root.removeAttribute('data-theme');
		return;
	}

	root.setAttribute('data-theme', preference);
}

/**
 * Applies a row density to the document.
 *
 * `'comfortable'` removes the attribute rather than setting it, so the default
 * lives in exactly one place — the `:root` block of the generated stylesheet —
 * instead of being restated here.
 */
export function applyDensity(preference: DensityName, root: HTMLElement): void {
	if (preference === 'comfortable') {
		root.removeAttribute('data-density');
		return;
	}

	root.setAttribute('data-density', preference);
}

/**
 * Applies an accent to the document.
 *
 * Like the density, the default accent is removed rather than written, so the
 * value in {@link SEMANTIC_COLORS} stays the single definition of what "no
 * preference" looks like.
 */
export function applyAccent(preference: AccentName, root: HTMLElement): void {
	if (preference === DEFAULT_ACCENT) {
		root.removeAttribute('data-accent');
		return;
	}

	root.setAttribute('data-accent', preference);
}
