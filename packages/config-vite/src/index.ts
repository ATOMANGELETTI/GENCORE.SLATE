import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { UserConfig } from 'vite';

/**
 * `@slate/config-vite` — one Vite configuration for all three applications.
 *
 * Everything here exists for a reason specific to a portable Tauri app; none
 * of it is boilerplate to be copied and tweaked per application.
 */

type SlateViteOptions = {
	/** The application's dev-server port. Each app needs its own. */
	port: number;
	/**
	 * HTML entry points besides `index.html`, relative to the project root.
	 *
	 * Every application has at least one: the tray menu is drawn by a second
	 * window rather than a native menu (ADR 0012), and a window needs its own
	 * document. Declared here rather than per application so all three keep
	 * the same build shape.
	 */
	entries?: string[];
	/** Extra configuration merged over the defaults. */
	overrides?: UserConfig;
};

/** Builds the Vite configuration for a Tauri frontend. */
export function slateViteConfig({
	port,
	entries = [],
	overrides = {},
}: SlateViteOptions): UserConfig {
	return {
		plugins: [react(), tailwindcss()],

		// Assets are loaded from the packaged bundle by relative path, not
		// served from a root. An absolute base produces a blank window in the
		// built application while working perfectly in development.
		base: './',

		clearScreen: false,

		server: {
			port,
			// Failing loudly beats silently moving to another port, which would
			// leave Tauri pointed at nothing.
			strictPort: true,
			// The Tauri window is the only client; watching target/ would
			// restart the dev server on every Rust rebuild.
			watch: { ignored: ['**/src-tauri/**', '**/target/**'] },
		},

		build: {
			// The oldest engine the bundled WebView2 runtime can be, so the
			// build never emits syntax it cannot parse.
			target: 'chrome120',
			outDir: 'dist',
			emptyOutDir: true,
			// Source maps ship only in a debug build: they would otherwise add
			// megabytes to a zip a user downloads.
			sourcemap: process.env.TAURI_ENV_DEBUG === 'true',
			// `true` means Vite's own bundled minifier. Naming one explicitly
			// (`'esbuild'`) would add an optional dependency Vite 8 no longer
			// ships, for no benefit.
			minify: process.env.TAURI_ENV_DEBUG !== 'true',
			chunkSizeWarningLimit: 800,
			// Naming `index.html` explicitly is required as soon as there is a
			// second entry: Vite's default single-entry behaviour stops applying
			// the moment `input` is set, and omitting it produces a build with
			// no main window at all.
			...(entries.length > 0 ? { rollupOptions: { input: ['index.html', ...entries] } } : {}),
		},

		// Only variables prefixed this way reach the frontend. The default
		// `VITE_` prefix is wide enough to leak something from a developer's
		// environment into a shipped bundle.
		envPrefix: ['SLATE_PUBLIC_'],

		...overrides,
	};
}
