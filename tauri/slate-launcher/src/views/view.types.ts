import type { SlateIcon } from '@slate/icons';

/**
 * The views that replace the app list when one is opened.
 *
 * Opening any of them widens the window and unmounts the list and rail; the
 * view then draws its own menu where the list was. `null` is the resting state,
 * and it is the absence of a view rather than a view of its own — modelling
 * "no view" as `'none'` would make every consumer handle a case that renders
 * nothing.
 */
export type ViewId = 'storage' | 'add' | 'console' | 'settings' | 'about' | 'help' | 'updates';

/**
 * A section within a view, listed down its left menu.
 *
 * Views with one section still declare it, so the menu is never conditionally
 * absent and the layout does not shift between views.
 */
export type ViewSection = {
	id: string;
	label: string;
	icon: SlateIcon;
};

/**
 * Everything the shell needs to render a view.
 *
 * One description, read by three places — the rail's action buttons, the view
 * menu, and the title bar's title. Three switch statements on `ViewId` would
 * drift the first time a view was renamed.
 */
export type ViewDescriptor = {
	id: ViewId;
	/** Shown in the title bar while the view is open. Uppercase is applied by CSS. */
	title: string;
	icon: SlateIcon;
	/** What the rail's tooltip says. Longer than the title where that helps. */
	tooltip: string;
	sections: ViewSection[];
	/**
	 * Whether the view is offered as one of the rail's five buttons.
	 *
	 * `help`, `about` and `updates` are reached by command, by the status bar,
	 * or by a key, so they are views without being buttons — the rail is five
	 * glyphs because five is what fits, not because there are five views.
	 */
	isInRail: boolean;
};
