import type { SlateIcon } from '@slate/icons';

/**
 * The description of a menu, shared by every surface that shows one.
 *
 * Menus are declared as data rather than as JSX so the same definition can be
 * rendered by the in-window context menus and by the tray popup, which lives
 * in a different window entirely and cannot receive a React tree. An
 * application owns its menu *definitions*; this package owns how they look.
 */

/** How an item reads. `danger` is for anything that discards or terminates. */
export type MenuItemTone = 'default' | 'danger';

/** One selectable entry. */
export type MenuItemDescriptor = {
	id: string;
	label: string;
	/** Leading glyph. Optional, but a menu is easier to scan when they agree. */
	icon?: SlateIcon;
	/**
	 * The keyboard shortcut, pre-formatted for display (`Ctrl+H`).
	 *
	 * Display only — this does not bind anything. The binding lives with the
	 * window that owns the action, so a shortcut shown here and a shortcut that
	 * works are deliberately two separate statements.
	 */
	shortcut?: string;
	tone?: MenuItemTone;
	disabled?: boolean;
	/**
	 * Renders a checkmark. `undefined` means the item is not checkable at all,
	 * which is different from being checkable and currently off.
	 */
	isChecked?: boolean;
	/** Why the item is unavailable. Surfaced as a tooltip when `disabled`. */
	unavailableReason?: string;
	/**
	 * Leaves the menu open once this item is chosen, instead of dismissing it
	 * as every ordinary item does.
	 *
	 * For an item that replaces the menu's own content with something else —
	 * the tray's "Check for Updates" opening a notice in the same window,
	 * say — rather than completing an action the way every other item does.
	 */
	keepOpen?: boolean;
	onSelect: () => void;
};

/** A rule drawn above the group that follows it. */
export type MenuSeparatorDescriptor = {
	id: string;
	kind: 'separator';
};

/** Anything a menu may contain. */
export type MenuEntry = MenuItemDescriptor | MenuSeparatorDescriptor;

/** Whether an entry is a rule rather than a selectable item. */
export function isSeparator(entry: MenuEntry): entry is MenuSeparatorDescriptor {
	return 'kind' in entry && entry.kind === 'separator';
}
