import {
	AdvancedIcon,
	AppearanceIcon,
	DesktopIcon,
	DriveIcon,
	FolderIcon,
	HelpIcon,
	InfoIcon,
	PackageIcon,
	PlusIcon,
	PrivacyIcon,
	SettingsIcon,
	TerminalIcon,
	UpdateAvailableIcon,
} from '@slate/icons';

import type { ViewDescriptor, ViewId } from './view.types.ts';

/**
 * Every view, described once.
 *
 * Three separate places need to know about views — the rail's action buttons,
 * the menu down the left of an open view, and the title bar's title — and each
 * one of them reads this. The alternative is three switch statements on
 * `ViewId` that agree until the first time a view is renamed.
 *
 * `Record` rather than an array, so a view added to `ViewId` without an entry
 * here fails to compile. That is the whole reason for the type: it is not
 * possible to ship a view the shell cannot title.
 */
export const VIEWS: Record<ViewId, ViewDescriptor> = {
	storage: {
		id: 'storage',
		title: 'Storage',
		icon: FolderIcon,
		tooltip: 'Storage',
		isInRail: true,
		sections: [
			{ id: 'folders', label: 'Folders', icon: FolderIcon },
			{ id: 'volume', label: 'Volume', icon: DriveIcon },
		],
	},
	add: {
		id: 'add',
		title: 'Add application',
		icon: PlusIcon,
		tooltip: 'Add application',
		isInRail: true,
		sections: [
			{ id: 'catalogue', label: 'From a catalogue', icon: PackageIcon },
			{ id: 'folder', label: 'From a folder', icon: FolderIcon },
		],
	},
	console: {
		id: 'console',
		title: 'Console',
		icon: TerminalIcon,
		tooltip: 'Console',
		isInRail: true,
		sections: [
			{ id: 'output', label: 'Output', icon: TerminalIcon },
			{ id: 'history', label: 'History', icon: DesktopIcon },
		],
	},
	settings: {
		id: 'settings',
		title: 'Settings',
		icon: SettingsIcon,
		tooltip: 'Settings',
		isInRail: true,
		sections: [
			{ id: 'appearance', label: 'Appearance', icon: AppearanceIcon },
			{ id: 'applications', label: 'Applications', icon: PackageIcon },
			{ id: 'storage', label: 'Storage', icon: DriveIcon },
			{ id: 'privacy', label: 'Privacy', icon: PrivacyIcon },
			{ id: 'advanced', label: 'Advanced', icon: AdvancedIcon },
		],
	},
	about: {
		id: 'about',
		title: 'About',
		icon: InfoIcon,
		tooltip: 'About',
		isInRail: true,
		sections: [
			{ id: 'suite', label: 'Suite', icon: InfoIcon },
			{ id: 'volume', label: 'Volume', icon: DriveIcon },
		],
	},

	// Reached by command, by a key, or by the status bar — not by a button.
	// The rail is five glyphs because five is what fits across its width, not
	// because there are five views.
	help: {
		id: 'help',
		title: 'Commands',
		icon: HelpIcon,
		tooltip: 'Commands',
		isInRail: false,
		sections: [{ id: 'commands', label: 'Commands', icon: HelpIcon }],
	},
	updates: {
		id: 'updates',
		title: 'Updates',
		icon: UpdateAvailableIcon,
		tooltip: 'Updates',
		isInRail: false,
		sections: [{ id: 'available', label: 'Available', icon: UpdateAvailableIcon }],
	},
};

/**
 * The five views the rail offers, in the order they are drawn.
 *
 * Derived rather than listed, so a view that stops being a rail button stops
 * appearing here without anything else needing to change.
 */
export const RAIL_VIEWS: ViewDescriptor[] = Object.values(VIEWS).filter((view) => view.isInRail);
