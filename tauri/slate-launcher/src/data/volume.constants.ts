/**
 * Which volume the suite is running from.
 *
 * Standing in for a command that would ask `slate-paths` for the portable
 * root's volume and the operating system for its type and free space. Shaped as
 * that command's return value for the same reason as the application list.
 *
 * `isRemovable` is the point of it. A suite on a USB stick behaves differently
 * from one in a folder — it can be pulled out mid-write — and the status bar
 * saying so is the cheapest possible warning. The safe-eject that follows from
 * it has to close every running application first, which is a change to
 * `slate-process`, not to this file.
 */
export type VolumeInfo = {
	/** The drive letter or volume label, as the user would recognise it. */
	label: string;
	isRemovable: boolean;
	/** Bytes. Formatted for display by `format-bytes.util.ts`. */
	usedBytes: number;
	totalBytes: number;
};

export const VOLUME: VolumeInfo = {
	label: 'SLATE (E:)',
	isRemovable: true,
	usedBytes: 570_368,
	totalBytes: 17_179_869_184,
};
