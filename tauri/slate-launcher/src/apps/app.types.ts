/**
 * What the Launcher knows about an application.
 *
 * Shaped as the return value of a Tauri command that does not exist yet.
 * `crates/launcher-core` already discovers applications and can describe them;
 * nothing on the frontend can reach it, so `src/data/apps.constants.ts` stands
 * in. Keeping this shape serialisable — no functions, no React components — is
 * what makes replacing that module with a real `invoke` a one-file change
 * rather than a rewrite of everything that reads it.
 *
 * That constraint is why `icon` is a *name* rather than a component: Rust can
 * send `'terminal'`, and `app-icon.constants.ts` maps it to a glyph on this
 * side of the boundary.
 */

/** Where an application came from. Matches the `programs/` tree's top level. */
export type AppSource = 'gencore' | 'portableapps.com' | 'portapps.io';

/**
 * What the application is doing.
 *
 * A union rather than a pair of booleans, per `.agents/rules/04-typescript.md`:
 * "running and has an update" is a state the list has to render as one thing,
 * and two flags would admit combinations the design has no answer for.
 */
export type AppState = 'ready' | 'running' | 'update';

/** The glyphs an application may be shown with. */
export type AppIconName =
	| 'terminal'
	| 'folder'
	| 'globe'
	| 'code'
	| 'download'
	| 'image'
	| 'music'
	| 'video'
	| 'file'
	| 'package'
	| 'lock'
	| 'search'
	| 'grid';

/** One entry in the Launcher's list. */
export type LauncherApp = {
	/** Stable across restarts; what `/run` and `/pin` address. */
	id: string;
	name: string;
	source: AppSource;
	version: string;
	icon: AppIconName;
	state: AppState;
};

/**
 * The group an application is listed under.
 *
 * `pinned` is derived from the user's own list rather than from the app, which
 * is why it is not an `AppSource`.
 */
export type AppGroup = 'pinned' | 'suite' | 'portable';

/** A rendered group: its heading and the applications beneath it. */
export type AppSection = {
	group: AppGroup;
	label: string;
	apps: LauncherApp[];
};
