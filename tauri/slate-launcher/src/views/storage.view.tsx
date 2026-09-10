import { EjectIcon, RemovableDriveIcon } from '@slate/icons';
import { Button, Meter, NavItem } from '@slate/ui-kit';
import { formatBytes } from '@slate/utils';

import { FOLDERS } from '../data/folders.constants.ts';
import { VOLUME } from '../data/volume.constants.ts';
import { NotBuiltYet, SettingRow, ViewHeading } from './setting-row.component.tsx';

/**
 * The portable `storage/` tree, and the volume it sits on.
 *
 * The volume section is where drive awareness lives. A suite running from a USB
 * stick can be pulled out mid-write, and the status bar's marker is only a
 * warning — this is where it is explained and where the safe eject would be.
 */

type StorageViewProps = {
	sectionId: string;
	onOpenFolder: (folderId: string) => void;
};

export function StorageView({ sectionId, onOpenFolder }: StorageViewProps) {
	if (sectionId === 'volume') {
		const freeBytes = VOLUME.totalBytes - VOLUME.usedBytes;

		return (
			<>
				<ViewHeading>Volume</ViewHeading>

				<div className="mb-5 flex items-center gap-3">
					<RemovableDriveIcon
						strokeWidth={1.5}
						aria-hidden="true"
						className="size-8 text-accent-default"
					/>
					<div>
						<div className="text-md text-primary">{VOLUME.label}</div>
						<div className="text-xs text-tertiary">
							{VOLUME.isRemovable ? 'Removable drive' : 'Fixed drive'}
						</div>
					</div>
				</div>

				<Meter
					label="Storage used"
					value={VOLUME.usedBytes}
					max={VOLUME.totalBytes}
					valueText={`${formatBytes(VOLUME.usedBytes)} of ${formatBytes(VOLUME.totalBytes)} used`}
					hint={`${formatBytes(VOLUME.usedBytes)} USED · ${formatBytes(freeBytes)} FREE`}
					className="mb-6"
				/>

				<SettingRow label="Capacity">
					<span className="font-mono text-xs text-tertiary">{formatBytes(VOLUME.totalBytes)}</span>
				</SettingRow>
				<SettingRow label="Free">
					<span className="font-mono text-xs text-tertiary">{formatBytes(freeBytes)}</span>
				</SettingRow>

				{VOLUME.isRemovable ? (
					<div className="mt-6 space-y-3">
						<Button disabled className="gap-2">
							<EjectIcon strokeWidth={1.5} aria-hidden="true" />
							Close everything and eject
						</Button>
						<NotBuiltYet
							what="Safe eject is not wired up"
							why="Ejecting has to close every running application first and wait for each to exit, which is a change to the process supervisor rather than to this window. Pulling the drive with an application still writing is exactly what this button exists to prevent, so it stays disabled until it can actually do that."
						/>
					</div>
				) : null}
			</>
		);
	}

	return (
		<>
			<ViewHeading>Folders</ViewHeading>
			<p className="mb-4 max-w-prose text-xs text-tertiary">
				Everything the suite writes stays inside the portable root. These are the directories under{' '}
				<span className="font-mono">storage/</span>.
			</p>

			<div className="flex flex-col">
				{FOLDERS.map((folder) => (
					<NavItem
						key={folder.id}
						icon={folder.icon}
						label={folder.label}
						isUppercase
						trailing={<span className="font-mono text-xs text-tertiary">storage/{folder.id}</span>}
						onClick={() => onOpenFolder(folder.id)}
					/>
				))}
			</div>
		</>
	);
}
