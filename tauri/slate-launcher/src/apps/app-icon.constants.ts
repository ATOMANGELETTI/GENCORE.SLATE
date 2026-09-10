import {
	CodeIcon,
	DownloadIcon,
	FileIcon,
	FolderIcon,
	GlobeIcon,
	GridIcon,
	ImageIcon,
	LockIcon,
	MusicIcon,
	PackageIcon,
	SearchIcon,
	type SlateIcon,
	TerminalIcon,
	VideoIcon,
} from '@slate/icons';

import type { AppIconName } from './app.types.ts';

/**
 * Maps an application's icon name to a glyph.
 *
 * This mapping exists on the frontend so the backend never has to send one. A
 * command can return `'terminal'`; it cannot return a React component, and a
 * contract that tried would stop being serialisable.
 *
 * Every application in the list draws from this set rather than shipping its
 * own artwork. Uniform stroke weight and a single colour are what let twenty
 * rows read as one list — per-app icons in their own brand colours turn the
 * column into a fruit salad, which is the specific failure the Launcher's
 * design is avoiding.
 */
export const APP_ICONS: Record<AppIconName, SlateIcon> = {
	terminal: TerminalIcon,
	folder: FolderIcon,
	globe: GlobeIcon,
	code: CodeIcon,
	download: DownloadIcon,
	image: ImageIcon,
	music: MusicIcon,
	video: VideoIcon,
	file: FileIcon,
	package: PackageIcon,
	lock: LockIcon,
	search: SearchIcon,
	grid: GridIcon,
};
