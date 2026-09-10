import {
	AppearanceIcon,
	FavouriteIcon,
	FolderOpenIcon,
	HelpIcon,
	InfoIcon,
	PlayIcon,
	PlusIcon,
	QuitIcon,
	SearchIcon,
	SettingsIcon,
} from '@slate/icons';

import { FOLDERS } from '../data/folders.constants.ts';
import type { CommandSpec } from './command.types.ts';

/**
 * Every slash command, described once.
 *
 * This is the single source for the parser's vocabulary, the hint strip's
 * chips, the predictor's candidates, and the `/help` reference. `/help` is
 * generated from this array rather than written beside it, which is the only
 * way a command list stays true.
 *
 * The folder flags are derived from `FOLDERS`, so `/open` offers exactly the
 * directories that exist under `installDir/storage/` and cannot drift from the
 * rail beside it.
 */
export const COMMAND_SPECS: CommandSpec[] = [
	{
		name: 'run',
		summary: 'Start an application',
		icon: PlayIcon,
		example: '/run --terminal',
		args: [
			{ flag: 'terminal', description: 'Start SLATE Terminal' },
			{ flag: 'explorer', description: 'Start SLATE Explorer' },
		],
	},
	{
		name: 'open',
		summary: 'Reveal a storage folder',
		icon: FolderOpenIcon,
		example: '/open --documents',
		args: FOLDERS.map((folder) => ({
			flag: folder.id,
			description: `Reveal storage/${folder.id}`,
		})),
	},
	{
		name: 'find',
		summary: 'Search files in storage',
		icon: SearchIcon,
		example: '/find invoice',
		args: [],
		unavailableReason: 'File search needs a backend command that is not built yet',
	},
	{
		name: 'config',
		summary: 'Change a setting',
		icon: SettingsIcon,
		example: '/config --theme dark',
		args: [
			{
				flag: 'theme',
				description: 'Window theme',
				values: ['system', 'light', 'dark'],
				takesValue: true,
			},
			{
				flag: 'accent',
				description: 'Accent colour',
				values: ['teal', 'cyan', 'blue'],
				takesValue: true,
			},
			{
				flag: 'density',
				description: 'Row height',
				values: ['comfortable', 'compact'],
				takesValue: true,
			},
			{
				flag: 'material',
				description: 'Window material',
				values: ['solid', 'mica', 'acrylic'],
				takesValue: true,
			},
		],
	},
	{
		name: 'pin',
		summary: 'Keep an application at the top of the list',
		icon: FavouriteIcon,
		example: '/pin terminal',
		args: [],
	},
	{
		name: 'unpin',
		summary: 'Remove an application from the pinned group',
		icon: FavouriteIcon,
		example: '/unpin terminal',
		args: [],
	},
	{
		name: 'add',
		summary: 'Add a portable application',
		icon: PlusIcon,
		example: '/add',
		args: [],
	},
	{
		name: 'reveal',
		summary: 'Reveal a suite directory in the file explorer',
		icon: FolderOpenIcon,
		example: '/reveal --config',
		args: [
			{ flag: 'root', description: 'The portable root' },
			{ flag: 'config', description: 'This application’s configuration file' },
			{ flag: 'logs', description: 'The suite’s log directory' },
		],
	},
	{
		name: 'theme',
		summary: 'Switch theme without the longer form',
		icon: AppearanceIcon,
		example: '/theme dark',
		args: [],
	},
	{
		name: 'about',
		summary: 'Version, build and volume',
		icon: InfoIcon,
		example: '/about',
		args: [],
	},
	{
		name: 'help',
		summary: 'Every command, with its arguments',
		icon: HelpIcon,
		example: '/help',
		args: [],
	},
	{
		name: 'quit',
		summary: 'Close every window and exit the suite',
		icon: QuitIcon,
		example: '/quit',
		args: [],
	},
];

/** One command by name, or `undefined` for a fragment that names none. */
export function findCommand(name: string): CommandSpec | undefined {
	return COMMAND_SPECS.find((spec) => spec.name === name);
}
