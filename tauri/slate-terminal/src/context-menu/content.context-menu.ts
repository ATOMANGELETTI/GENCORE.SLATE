import {
	CopyIcon,
	InfoIcon,
	PasteIcon,
	ReloadIcon,
	SettingsIcon,
	ZoomInIcon,
	ZoomOutIcon,
} from '@slate/icons';
import type { WebviewZoom } from '@slate/ipc';
import type { MenuEntry } from '@slate/ui-kit';

/** What the content menu needs from the application around it. */
export type ContentMenuActions = {
	zoom: WebviewZoom;
	/** Reveals this app's config file — there is no Preferences window yet,
	 *  and revealing the file it would eventually edit is useful today. */
	onOpenPreferences: () => void;
	onShowAbout: () => void;
};

/**
 * The menu offered on a right-click of the content area.
 *
 * Application-level rather than window-level: the title bar already answers
 * "what can I do to this window", so repeating those items here would waste
 * the one gesture that could have offered something else.
 *
 * Copy and Paste act on the document's own selection rather than going through
 * a clipboard plugin, which is why neither needs a permission the suite would
 * otherwise have to justify.
 */
export function buildContentContextMenu({
	zoom,
	onOpenPreferences,
	onShowAbout,
}: ContentMenuActions): MenuEntry[] {
	return [
		{
			id: 'reload',
			label: 'Reload',
			icon: ReloadIcon,
			shortcut: 'Ctrl+R',
			onSelect: () => window.location.reload(),
		},
		{ id: 'sep-zoom', kind: 'separator' },
		{
			id: 'zoom-in',
			label: 'Zoom In',
			icon: ZoomInIcon,
			shortcut: 'Ctrl+=',
			disabled: !zoom.canZoomIn,
			unavailableReason: 'Already at the largest size',
			onSelect: zoom.zoomIn,
		},
		{
			id: 'zoom-out',
			label: 'Zoom Out',
			icon: ZoomOutIcon,
			shortcut: 'Ctrl+-',
			disabled: !zoom.canZoomOut,
			unavailableReason: 'Already at the smallest size',
			onSelect: zoom.zoomOut,
		},
		{
			id: 'zoom-reset',
			label: 'Reset Zoom',
			shortcut: 'Ctrl+0',
			disabled: zoom.factor === 1,
			unavailableReason: 'Already at the default size',
			onSelect: zoom.reset,
		},
		{ id: 'sep-clipboard', kind: 'separator' },
		{
			id: 'copy',
			label: 'Copy',
			icon: CopyIcon,
			shortcut: 'Ctrl+C',
			disabled: (globalThis.getSelection()?.toString().length ?? 0) === 0,
			unavailableReason: 'Nothing is selected',
			onSelect: () => void document.execCommand('copy'),
		},
		{
			id: 'paste',
			label: 'Paste',
			icon: PasteIcon,
			shortcut: 'Ctrl+V',
			onSelect: () => void document.execCommand('paste'),
		},
		{ id: 'sep-app', kind: 'separator' },
		{
			id: 'preferences',
			label: 'Preferences',
			icon: SettingsIcon,
			shortcut: 'Ctrl+,',
			onSelect: onOpenPreferences,
		},
		{
			id: 'about',
			label: 'About Terminal',
			icon: InfoIcon,
			onSelect: onShowAbout,
		},
	];
}
