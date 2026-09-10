import type { RuntimeInfo } from '@slate/bindings';
import { LayoutIcon, RemovableDriveIcon } from '@slate/icons';
import { formatBytes } from '@slate/utils';

import { VOLUME } from '../data/volume.constants.ts';
import { SettingRow, ViewHeading } from './setting-row.component.tsx';

/**
 * What this is, and where it is running from.
 *
 * Note what is absent: any absolute path. `RuntimeInfo` deliberately carries
 * none, because the frontend has no legitimate use for one and showing it only
 * creates a way for someone's directory layout to end up in a screenshot.
 * `installDir/` is what the user needs to know, and it is enough.
 */

type AboutViewProps = {
	sectionId: string;
	runtime: RuntimeInfo | null;
};

export function AboutView({ sectionId, runtime }: AboutViewProps) {
	if (sectionId === 'volume') {
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
							{VOLUME.isRemovable ? 'Removable — close the suite before unplugging' : 'Fixed drive'}
						</div>
					</div>
				</div>

				<SettingRow label="Free space">
					<span className="font-mono text-xs text-tertiary">
						{formatBytes(VOLUME.totalBytes - VOLUME.usedBytes)}
					</span>
				</SettingRow>
				<SettingRow label="Suite footprint">
					<span className="font-mono text-xs text-tertiary">{formatBytes(VOLUME.usedBytes)}</span>
				</SettingRow>
			</>
		);
	}

	return (
		<>
			<div className="mb-5 flex items-center gap-3">
				<LayoutIcon strokeWidth={1.5} aria-hidden="true" className="size-8 text-accent-default" />
				<div>
					<div className="text-lg font-semibold tracking-tight text-primary">SLATE Launcher</div>
					<div className="text-xs text-tertiary">
						Launches the suite&rsquo;s apps and third-party portable apps
					</div>
				</div>
			</div>

			<SettingRow label="Suite version">
				<span className="font-mono text-xs text-tertiary">{runtime?.suiteVersion ?? '—'}</span>
			</SettingRow>
			<SettingRow label="Protocol version">
				<span className="font-mono text-xs text-tertiary">
					{runtime ? String(runtime.protocolVersion) : '—'}
				</span>
			</SettingRow>
			<SettingRow label="Install fingerprint" description="Identifies this copy of the suite">
				<span className="font-mono text-xs text-tertiary">
					{runtime?.installFingerprint ?? '—'}
				</span>
			</SettingRow>
			<SettingRow label="Portable root" description="Nothing is written outside it">
				<span className="font-mono text-xs text-tertiary">installDir/</span>
			</SettingRow>

			<p className="mt-5 text-xs text-tertiary">
				Copyright &copy; 2026 Dustin Angeletti. All rights reserved. Fira Sans and Fira Code are
				licensed under the SIL Open Font License 1.1.
			</p>
		</>
	);
}
