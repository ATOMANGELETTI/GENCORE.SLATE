/**
 * The portable layout, declared once.
 *
 * `bun-package.ts` builds the tree from this manifest and then verifies the
 * result against the same manifest. That symmetry is the point: a file that
 * quietly stopped being copied fails the build instead of shipping, and the
 * shape of the product is described in one readable place rather than being
 * implied by a sequence of copy commands.
 *
 * Documented for humans in `.agents/architecture/install-layout.md`.
 */

/** The applications the suite ships. */
export const SUITE_APPS = ['slate-launcher', 'slate-terminal', 'slate-explorer'] as const;

/** One of the suite's own applications. */
export type SuiteApp = (typeof SUITE_APPS)[number];

/**
 * Directories created in every packaged tree.
 *
 * Empty directories are created deliberately rather than left to appear on
 * first run: a user who opens the folder should see the shape of the thing,
 * and some zip tools drop empty directories, which is why each also gets a
 * `.gitkeep`.
 */
export const LAYOUT_DIRECTORIES = [
	'appdata/binaries/webview2',
	'appdata/config',
	'appdata/database',
	'appdata/logs',
	'appdata/resources',
	'appdata/webview2',
	'programs/gencore/slate',
	'programs/portableapps.com',
	'programs/portapps.io',
	'storage/desktop',
	'storage/documents',
	'storage/downloads',
	'storage/music',
	'storage/pictures',
	'storage/videos',
] as const;

/** A file the packaged tree must contain. */
export type LayoutFile = {
	/** Where it lands, relative to the portable root. */
	destination: string;
	/** Where it comes from, relative to the repository root. */
	source: string;
	/** Whether packaging fails when the source is missing. */
	required: boolean;
	/** Why this file is here, shown when it is missing. */
	reason: string;
};

/** Every file copied into the tree, given a release build. */
export function layoutFiles(): LayoutFile[] {
	const files: LayoutFile[] = [
		{
			destination: 'Slate.exe',
			source: 'target/release/Slate.exe',
			required: true,
			reason: 'the entry point users double-click after extracting the zip',
		},
	];

	for (const app of SUITE_APPS) {
		files.push({
			destination: `programs/gencore/slate/${app}/${app}.exe`,
			source: `target/release/${app}.exe`,
			required: true,
			reason: `the ${app} application`,
		});

		for (const icon of ['icon.png', 'icon.ico']) {
			files.push({
				destination: `programs/gencore/slate/${app}/icons/${icon}`,
				source: `tauri/${app}/src-tauri/icons/${icon}`,
				required: false,
				reason: `the ${app} icon, shown in the Launcher`,
			});
		}
	}

	return files;
}

/**
 * Default configuration seeded into a fresh install.
 *
 * Written as readable, commented TOML rather than an empty file: the first
 * thing a curious user does with a portable app is open its config directory,
 * and finding an explanation there is worth more than finding nothing.
 */
export function seedConfig(): Array<{ destination: string; contents: string }> {
	return [
		{
			destination: 'appdata/config/suite.toml',
			contents: [
				'# Settings shared by every SLATE application.',
				'# Delete any line to return it to its default.',
				'',
				'# system | light | dark',
				'theme = "dark"',
				'',
				'# solid | mica | acrylic  (Mica and Acrylic need Windows 11)',
				'material = "mica"',
				'',
				'# Follow the Windows accent colour instead of the suite blue.',
				'use-system-accent = true',
				'',
				'# Collapse animations to opacity changes only.',
				'reduce-motion = false',
				'',
				'# error | warn | info | debug | trace',
				'log-level = "info"',
				'',
				'# Days of rolling logs to keep in appdata/logs.',
				'log-retention-days = 14',
				'',
			].join('\n'),
		},
		...SUITE_APPS.map((app) => ({
			destination: `appdata/config/${app}.toml`,
			contents: [
				`# Settings specific to ${app}.`,
				'# Anything set here overrides suite.toml for this application only.',
				'',
				'[window]',
				'width = 1100.0',
				'height = 720.0',
				'maximized = false',
				'',
			].join('\n'),
		})),
	];
}

/** The `.slate-root` marker written at the top of the tree. */
export function rootMarker(version: string, buildId: string): string {
	return [
		'# Identifies this directory as a SLATE portable install.',
		'# Written by scripts/bun-package.ts. Do not edit.',
		'#',
		'# slate-paths walks upward from a running executable looking for this',
		'# file; deleting it breaks the install (ADR 0004).',
		'',
		'[suite]',
		`version = "${version}"`,
		`build_id = "${buildId}"`,
		'schema_version = 1',
		'',
		'[layout]',
		'appdata = "appdata"',
		'programs = "programs"',
		'storage = "storage"',
		'',
	].join('\n');
}

/** The README placed at the top of the extracted tree. */
export function rootReadme(version: string): string {
	return [
		`# GENCORE.SLATE ${version}`,
		'',
		'A portable application suite. Everything it needs is in this folder, and',
		'everything it writes stays in this folder.',
		'',
		'## Running it',
		'',
		'Double-click `Slate.exe`.',
		'',
		'Windows will warn that the publisher is unrecognised, because this build is',
		'not code-signed. Choose **More info** then **Run anyway** if you trust where',
		'you got it from.',
		'',
		'## Moving it',
		'',
		'Close the applications, then copy or move this whole folder anywhere — a USB',
		'stick, another drive, another computer. Your settings, database, and files',
		'travel with it. Nothing is left behind, because nothing was ever written',
		'outside this folder.',
		'',
		'## What is in here',
		'',
		'| Folder      | Contents                                                     |',
		'| ----------- | ------------------------------------------------------------ |',
		'| `appdata/`  | Settings, database, logs, and the bundled browser runtime     |',
		'| `programs/` | The applications themselves, grouped by who published them    |',
		'| `storage/`  | Your documents, downloads, pictures, and so on                |',
		'',
		'`.slate-root` marks this folder as an install. Do not delete it.',
		'',
	].join('\n');
}
