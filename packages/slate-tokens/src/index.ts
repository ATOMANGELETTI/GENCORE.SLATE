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
 */

export { generateTokensCss, TOKEN_PREFIX } from './generate/css.generator.ts';
export {
	type ColorRole,
	NEUTRAL,
	PALETTE,
	SEMANTIC_COLORS,
	type ThemeName,
} from './tokens/color.tokens.ts';
export {
	CHROME,
	LAYER,
	MOTION,
	RADIUS,
	SHADOW,
	SPACE,
	TYPOGRAPHY,
} from './tokens/layout.tokens.ts';

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
