import {
	FolderIcon,
	HideIcon,
	QuitIcon,
	SettingsIcon,
	TerminalIcon,
	UpdateIcon,
	WindowIcon,
} from '@slate/icons';
import type { TrayMenu } from '@slate/ipc';
import type { MenuEntry } from '@slate/ui-kit';

/**
 * Launcher-specific tray behaviour, injected rather than called directly here.
 *
 * None of this has a shared IPC contract behind it — starting a sibling
 * application, or showing the tray's own "coming soon" notice — so the actual
 * work lives beside where this is constructed for real (`tray.root.tsx`)
 * rather than in this file, which keeps this a plain, testable mapping from
 * state to a menu, the same shape as every other item below.
 */
export type LauncherTrayActions = {
	openTerminal: () => void;
	openExplorer: () => void;
	/** Replaces the menu with the "coming soon" notice — see `keepOpen` below. */
	showUpdateNotice: () => void;
};

/**
 * The menu the tray icon opens.
 *
 * The third of the suite's three menus, and the only one that can offer Quit:
 * closing the window hides it to the tray rather than exiting, so this is the
 * deliberate way out of the process.
 *
 * Show and Hide are one item that swaps, rather than two of which one is always
 * disabled — the state is knowable, so offering the wrong half greyed out is
 * just a worse way of saying the same thing.
 */
export function buildTrayMenu(tray: TrayMenu, launch: LauncherTrayActions): MenuEntry[] {
	return [
		tray.isMainWindowVisible
			? {
					id: 'hide-window',
					label: 'Hide Window',
					icon: HideIcon,
					shortcut: 'Ctrl+H',
					onSelect: tray.hideMainWindow,
				}
			: {
					id: 'show-window',
					label: 'Show Window',
					icon: WindowIcon,
					onSelect: tray.showMainWindow,
				},
		{
			id: 'preferences',
			label: 'Preferences',
			icon: SettingsIcon,
			shortcut: 'Ctrl+,',
			onSelect: tray.openPreferences,
		},
		{ id: 'tray-sep-apps', kind: 'separator' },
		{
			id: 'open-terminal',
			label: 'Open Terminal',
			icon: TerminalIcon,
			onSelect: launch.openTerminal,
		},
		{
			id: 'open-explorer',
			label: 'Open Explorer',
			icon: FolderIcon,
			onSelect: launch.openExplorer,
		},
		{ id: 'tray-sep-updates', kind: 'separator' },
		{
			id: 'check-updates',
			label: 'Check for Updates',
			icon: UpdateIcon,
			// There is no update channel yet, but the item leads somewhere real —
			// a "coming soon" notice in this same window — rather than sitting
			// disabled with an explanation, which is how it worked before.
			keepOpen: true,
			onSelect: launch.showUpdateNotice,
		},
		{ id: 'tray-sep-quit', kind: 'separator' },
		{
			id: 'quit',
			label: 'Quit Launcher',
			icon: QuitIcon,
			shortcut: 'Alt+F4',
			tone: 'danger',
			onSelect: tray.quit,
		},
	];
}
