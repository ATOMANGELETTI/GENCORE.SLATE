import type { LauncherApp } from '../apps/app.types.ts';

/**
 * The applications the Launcher lists, until discovery is wired up.
 *
 * `crates/launcher-core` already discovers applications and can describe them.
 * What is missing is a Tauri command to ask it, so this module stands in — and
 * it is written as the exact payload such a command would return, so that
 * replacing it means changing one import rather than every component that reads
 * an application.
 *
 * The two suite entries are real: `slate_launcher_launch_app` can already start
 * Terminal and Explorer, and their ids match the `AppId`s it accepts. The
 * portable entries are invented, and their versions are plausible rather than
 * accurate — they exist to prove the list renders at a realistic length, which
 * a two-item list would not.
 */
export const APPS: LauncherApp[] = [
	{
		id: 'slate-terminal',
		name: 'Terminal',
		source: 'gencore',
		version: '0.1.0',
		icon: 'terminal',
		state: 'running',
	},
	{
		id: 'slate-explorer',
		name: 'Explorer',
		source: 'gencore',
		version: '0.1.0',
		icon: 'folder',
		state: 'ready',
	},

	{
		id: 'browser',
		name: 'Browser',
		source: 'portableapps.com',
		version: '121.0',
		icon: 'globe',
		state: 'ready',
	},
	{
		id: 'calculator',
		name: 'Calculator',
		source: 'portableapps.com',
		version: '1.4.0',
		icon: 'grid',
		state: 'ready',
	},
	{
		id: 'code',
		name: 'Code',
		source: 'portapps.io',
		version: '1.96.2',
		icon: 'code',
		state: 'ready',
	},
	{
		id: 'crypto',
		name: 'Crypto',
		source: 'portapps.io',
		version: '2.1.4',
		icon: 'lock',
		state: 'ready',
	},
	{
		id: 'downloader',
		name: 'Downloader',
		source: 'portapps.io',
		version: '6.9.1',
		icon: 'download',
		state: 'update',
	},
	{
		id: 'editor',
		name: 'Editor',
		source: 'portableapps.com',
		version: '0.9.7',
		icon: 'file',
		state: 'ready',
	},
	{
		id: 'filesync',
		name: 'FileSync',
		source: 'portapps.io',
		version: '3.2.0',
		icon: 'folder',
		state: 'ready',
	},
	{
		id: 'gallery',
		name: 'Gallery',
		source: 'portableapps.com',
		version: '2.0.1',
		icon: 'image',
		state: 'ready',
	},
	{
		id: 'notes',
		name: 'Notes',
		source: 'portableapps.com',
		version: '4.11',
		icon: 'file',
		state: 'ready',
	},
	{
		id: 'packer',
		name: 'Packer',
		source: 'portapps.io',
		version: '6.0.3',
		icon: 'package',
		state: 'update',
	},
	{
		id: 'player',
		name: 'Player',
		source: 'portableapps.com',
		version: '3.0.20',
		icon: 'video',
		state: 'ready',
	},
	{
		id: 'search',
		name: 'Search',
		source: 'portapps.io',
		version: '1.8.0',
		icon: 'search',
		state: 'ready',
	},
	{
		id: 'studio',
		name: 'Studio',
		source: 'portableapps.com',
		version: '5.3.1',
		icon: 'music',
		state: 'ready',
	},
	{
		id: 'sync',
		name: 'Sync',
		source: 'portapps.io',
		version: '2.4.6',
		icon: 'download',
		state: 'ready',
	},
];
