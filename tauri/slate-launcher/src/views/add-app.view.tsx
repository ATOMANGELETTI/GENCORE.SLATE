import { FolderOpenIcon, PackageIcon } from '@slate/icons';
import { Button, TextField } from '@slate/ui-kit';

import { NotBuiltYet, SettingRow, ViewHeading } from './setting-row.component.tsx';

/**
 * Adding a portable application.
 *
 * Two routes, deliberately different in weight. Pointing at a folder is
 * something the Launcher could do today with a directory picker; browsing a
 * catalogue means network access, a widened content security policy, and an
 * HTTP permission the capability file does not grant. The page says which is
 * which rather than offering both as if they were equally close.
 */

export function AddAppView({ sectionId }: { sectionId: string }) {
	if (sectionId === 'catalogue') {
		return (
			<>
				<ViewHeading>From a catalogue</ViewHeading>

				<TextField
					label="Search catalogues"
					isLabelHidden
					placeholder="Search PortableApps.com and portapps.io"
					disabled
					className="mb-5"
				/>

				<div className="mb-5 flex flex-col gap-2">
					<SettingRow label="PortableApps.com" description="Not connected">
						<PackageIcon strokeWidth={1.5} aria-hidden="true" className="size-4 text-tertiary" />
					</SettingRow>
					<SettingRow label="portapps.io" description="Not connected">
						<PackageIcon strokeWidth={1.5} aria-hidden="true" className="size-4 text-tertiary" />
					</SettingRow>
				</div>

				<NotBuiltYet
					what="Catalogue browsing needs network access"
					why="Every window's content security policy currently allows connections to the IPC channel and nothing else, and the capability file grants no HTTP permission. Reaching a catalogue means widening both, which is a security decision that wants its own architecture decision record rather than being made in passing."
				/>
			</>
		);
	}

	return (
		<>
			<ViewHeading>From a folder</ViewHeading>
			<p className="mb-5 max-w-prose text-xs text-tertiary">
				Point the Launcher at a portable application already on this drive. It is copied into{' '}
				<span className="font-mono">programs/</span> so it travels with the suite.
			</p>

			<div className="mb-5 flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-strong bg-inset px-6 py-10 text-center">
				<FolderOpenIcon strokeWidth={1.5} aria-hidden="true" className="size-7 text-tertiary" />
				<div className="text-base text-secondary">Drop an application folder here</div>
				<div className="text-xs text-tertiary">or choose one</div>
				<Button disabled>Choose a folder…</Button>
			</div>

			<NotBuiltYet
				what="Neither route is connected yet"
				why="Both need a command that can copy a directory into the portable root and register what it finds. `launcher-core` can already describe an application once it is there; what is missing is the step that puts it there."
			/>
		</>
	);
}
