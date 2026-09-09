import { CloseIcon, HideIcon, MinimiseIcon, PinIcon, RestoreIcon, ZoomIcon } from '@slate/icons';
import type { WindowChrome } from '@slate/ipc';
import type { MenuEntry } from '@slate/ui-kit';

/**
 * The menu offered on a right-click of the title bar.
 *
 * Right-clicking a title bar is a long-standing Windows habit, and custom
 * chrome removes the system menu that would normally answer it. Rebuilding the
 * useful half keeps the window controllable for anyone who reaches for it —
 * including keyboard and assistive-technology users, for whom the traffic
 * lights alone are not enough.
 *
 * Deliberately **window** operations only. The content area offers a different
 * menu, because a right-click that produces the same items wherever it lands
 * is telling the user their click carried no meaning.
 *
 * The permanently-greyed Restore/Move/Size trio a native Windows system menu
 * shows is not reproduced: a control that can never be enabled is worse than
 * an absent one.
 */
export function buildTitlebarContextMenu(chrome: WindowChrome): MenuEntry[] {
	return [
		{
			id: 'minimise',
			label: 'Minimise',
			icon: MinimiseIcon,
			shortcut: 'Ctrl+M',
			disabled: chrome.visibility === 'minimized',
			onSelect: chrome.minimize,
		},
		{
			id: 'toggle-maximise',
			label: chrome.isMaximized ? 'Restore' : 'Zoom',
			icon: chrome.isMaximized ? RestoreIcon : ZoomIcon,
			shortcut: 'Ctrl+Shift+M',
			onSelect: chrome.toggleMaximize,
		},
		{ id: 'sep-pin', kind: 'separator' },
		{
			id: 'always-on-top',
			label: 'Always on Top',
			icon: PinIcon,
			isChecked: chrome.isAlwaysOnTop,
			onSelect: () => chrome.setAlwaysOnTop(!chrome.isAlwaysOnTop),
		},
		{ id: 'sep-close', kind: 'separator' },
		{
			id: 'hide',
			label: 'Hide to Tray',
			icon: HideIcon,
			shortcut: 'Ctrl+H',
			onSelect: chrome.hide,
		},
		{
			id: 'close',
			label: 'Close',
			icon: CloseIcon,
			shortcut: 'Alt+F4',
			tone: 'danger',
			onSelect: chrome.close,
		},
	];
}
