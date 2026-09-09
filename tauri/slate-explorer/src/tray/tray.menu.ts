import { HideIcon, QuitIcon, SettingsIcon, UpdateIcon, WindowIcon } from '@slate/icons';
import type { TrayMenu } from '@slate/ipc';
import type { MenuEntry } from '@slate/ui-kit';

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
export function buildTrayMenu(tray: TrayMenu): MenuEntry[] {
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
		{ id: 'tray-sep-updates', kind: 'separator' },
		{
			id: 'check-updates',
			label: 'Check for Updates',
			icon: UpdateIcon,
			disabled: true,
			unavailableReason: 'The suite has no update channel yet',
			onSelect: () => {},
		},
		{ id: 'tray-sep-quit', kind: 'separator' },
		{
			id: 'quit',
			label: 'Quit Explorer',
			icon: QuitIcon,
			shortcut: 'Alt+F4',
			tone: 'danger',
			onSelect: tray.quit,
		},
	];
}
