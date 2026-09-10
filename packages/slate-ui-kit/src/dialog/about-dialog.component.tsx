import type { SlateIcon } from '@slate/icons';

import { Dialog } from './dialog.component.tsx';

/**
 * The dialog "About <App>" opens.
 *
 * One composition, reused by all three applications with different props —
 * the moment a second app needed this (the first one did), it belongs here
 * rather than in an application's own components.
 */

type AboutDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** The application's name, e.g. "Launcher". */
	appName: string;
	icon: SlateIcon;
	/** A short line describing what the application does. */
	description: string;
	/** `null` while the version has not loaded yet — shown as a placeholder
	 *  rather than an empty line, since the dialog can open before the first
	 *  IPC round trip resolves. */
	suiteVersion: string | null;
	copyright: string;
};

export function AboutDialog({
	open,
	onOpenChange,
	appName,
	icon: Icon,
	description,
	suiteVersion,
	copyright,
}: AboutDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange} title={`About ${appName}`}>
			<div className="flex size-16 items-center justify-center rounded-2xl bg-elevated text-accent-default">
				<Icon aria-hidden="true" className="size-8" />
			</div>

			<div className="flex flex-col items-center gap-1 text-center">
				<h2 className="text-lg font-semibold tracking-tight text-primary">{appName}</h2>
				<p className="font-mono text-xs text-tertiary">SLATE {suiteVersion ?? '—'}</p>
			</div>

			<p className="text-center text-sm text-secondary">{description}</p>

			<p className="text-center text-2xs text-tertiary">{copyright}</p>
		</Dialog>
	);
}
