import {
	DesktopIcon,
	DownloadIcon,
	FileIcon,
	ImageIcon,
	MusicIcon,
	type SlateIcon,
	VideoIcon,
} from '@slate/icons';

/**
 * The user's folders inside the portable root.
 *
 * These are not a design choice — they are exactly the directories that exist
 * under `installDir/storage/`, and the two lists have to stay identical. A
 * folder shown here that is not there is a row that opens nothing; a folder
 * there that is not here is storage the user cannot reach from the Launcher.
 *
 * `id` is the segment under `storage/`, which is also the argument `/open`
 * takes — `/open --documents` resolves to `storage/documents`. Paths are never
 * built from these on the frontend: the id crosses the boundary and
 * `slate-paths` resolves it, because a path assembled here would be a path that
 * did not come from `SlatePaths`.
 */
export type StorageFolder = {
	/** The directory name under `storage/`, and the `/open` argument. */
	id: string;
	label: string;
	icon: SlateIcon;
};

export const FOLDERS: StorageFolder[] = [
	{ id: 'desktop', label: 'Desktop', icon: DesktopIcon },
	{ id: 'downloads', label: 'Downloads', icon: DownloadIcon },
	{ id: 'documents', label: 'Documents', icon: FileIcon },
	{ id: 'pictures', label: 'Pictures', icon: ImageIcon },
	{ id: 'videos', label: 'Videos', icon: VideoIcon },
	{ id: 'music', label: 'Music', icon: MusicIcon },
];
