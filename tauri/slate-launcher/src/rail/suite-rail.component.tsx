import { Meter, NavItem, SectionLabel } from '@slate/ui-kit';
import { formatBytes } from '@slate/utils';

import { FOLDERS } from '../data/folders.constants.ts';
import { VOLUME } from '../data/volume.constants.ts';
import type { ViewId } from '../views/view.types.ts';
import { RailActions } from './rail-actions.component.tsx';

/**
 * The Launcher's right-hand column: who this is, where the files are, and what
 * else can be opened.
 *
 * Narrow on purpose. The application list is what the window exists for, so the
 * rail takes the smallest width that fits a folder name and gives the rest
 * back. It is also the only part of the window that never scrolls, which is
 * what makes the five action buttons findable — they are always in the same
 * place.
 */

type SuiteRailProps = {
	suiteVersion: string | null;
	activeView: ViewId | null;
	onOpenView: (view: ViewId) => void;
	onOpenFolder: (folderId: string) => void;
};

export function SuiteRail({ suiteVersion, activeView, onOpenView, onOpenFolder }: SuiteRailProps) {
	return (
		<aside className="flex w-[var(--slate-chrome-railWidth)] shrink-0 flex-col px-4 py-4">
			<div className="flex items-baseline gap-2">
				<span className="text-xl font-semibold tracking-wide">SLATE</span>
				{suiteVersion ? (
					<span className="font-mono text-xs text-tertiary">{suiteVersion}</span>
				) : null}
			</div>
			<SectionLabel className="px-0 pt-1 pb-0">Portable suite</SectionLabel>

			<SectionLabel id="rail-folders" className="px-0">
				Folders
			</SectionLabel>
			<nav aria-labelledby="rail-folders" className="flex flex-col">
				{FOLDERS.map((folder) => (
					<NavItem
						key={folder.id}
						icon={folder.icon}
						label={folder.label}
						isUppercase
						className="px-0"
						onClick={() => onOpenFolder(folder.id)}
					/>
				))}
			</nav>

			<div className="flex-1" />

			<SectionLabel className="px-0">Storage</SectionLabel>
			<Meter
				label="Storage used"
				value={VOLUME.usedBytes}
				max={VOLUME.totalBytes}
				valueText={`${formatBytes(VOLUME.usedBytes)} of ${formatBytes(VOLUME.totalBytes)} used`}
				hint={`${formatBytes(VOLUME.usedBytes)} USED · ${formatBytes(
					VOLUME.totalBytes - VOLUME.usedBytes,
				)} FREE`}
				className="mb-4"
			/>

			<RailActions activeView={activeView} onSelect={onOpenView} />
		</aside>
	);
}
