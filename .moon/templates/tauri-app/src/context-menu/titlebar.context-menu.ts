import type { WindowChrome } from '@slate/ipc';

/** One entry in a context menu. */
export type ContextMenuItem = {
	id: string;
	label: string;
	/** Rendered as a separator above this item. */
	separatorBefore?: boolean;
	disabled?: boolean;
	action: () => void;
};

/**
 * The context menu offered on the {{ title }} title bar.
 *
 * Right-clicking a title bar is a long-standing Windows habit, and custom
 * chrome removes the system menu that would normally answer it. Rebuilding the
 * useful half of that menu keeps the window controllable for anyone who
 * reaches for it — including keyboard and assistive-technology users, for whom
 * the traffic lights alone are not enough.
 */
export function buildTitlebarContextMenu(chrome: WindowChrome): ContextMenuItem[] {
	return [
		{
			id: 'minimize',
			label: 'Minimise',
			disabled: chrome.isMinimized,
			action: chrome.minimize,
		},
		{
			id: 'toggle-maximize',
			label: chrome.isMaximized ? 'Restore' : 'Zoom',
			action: chrome.toggleMaximize,
		},
		{
			id: 'close',
			label: 'Close',
			separatorBefore: true,
			action: chrome.close,
		},
	];
}
