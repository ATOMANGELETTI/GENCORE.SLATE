import { describe, expect, mock, test } from 'bun:test';
import type { TrayMenu } from '@slate/ipc';
import { isSeparator, type MenuItemDescriptor } from '@slate/ui-kit';

import { buildTrayMenu, type LauncherTrayActions } from '../../../src/tray/tray.menu.ts';

function tray(overrides: Partial<TrayMenu> = {}): TrayMenu {
	return {
		surfaceRef: { current: null },
		isMainWindowVisible: true,
		showMainWindow: mock(() => {}),
		hideMainWindow: mock(() => {}),
		openPreferences: mock(() => {}),
		quit: mock(() => {}),
		dismiss: mock(() => {}),
		...overrides,
	};
}

function launch(overrides: Partial<LauncherTrayActions> = {}): LauncherTrayActions {
	return {
		openTerminal: mock(() => {}),
		openExplorer: mock(() => {}),
		showUpdateNotice: mock(() => {}),
		...overrides,
	};
}

function items(trayState = tray(), launchState = launch()): MenuItemDescriptor[] {
	return buildTrayMenu(trayState, launchState).filter(
		(entry): entry is MenuItemDescriptor => !isSeparator(entry),
	);
}

describe('the Launcher tray menu', () => {
	test('offers Hide while the window is on screen', () => {
		const ids = items().map((item) => item.id);

		expect(ids).toContain('hide-window');
		expect(ids).not.toContain('show-window');
	});

	test('offers Show once the window is hidden', () => {
		// One item that swaps rather than two of which one is always greyed:
		// the state is knowable, so a disabled half would just say it worse.
		const ids = items(tray({ isMainWindowVisible: false })).map((item) => item.id);

		expect(ids).toContain('show-window');
		expect(ids).not.toContain('hide-window');
	});

	test('is the only menu that can quit', () => {
		// Closing the window hides it to the tray, so this is the deliberate
		// way out of the process.
		const quit = items().find((item) => item.id === 'quit');

		expect(quit).toBeDefined();
		expect(quit?.tone).toBe('danger');
		expect(quit?.label).toBe('Quit Launcher');
	});

	test('quitting runs the operation it names', () => {
		const state = tray();
		items(state)
			.find((item) => item.id === 'quit')
			?.onSelect();

		expect(state.quit).toHaveBeenCalledTimes(1);
	});

	test('preferences reveals the config file rather than sitting disabled', () => {
		// There is no Preferences window, but the item is genuinely useful —
		// see `content.context-menu.ts` for the same choice on the other menu.
		const state = tray();
		const preferences = items(state).find((item) => item.id === 'preferences');

		expect(preferences?.disabled).toBeFalsy();

		preferences?.onSelect();

		expect(state.openPreferences).toHaveBeenCalledTimes(1);
	});

	test('opening Terminal and Explorer is available rather than disabled', () => {
		// The Launcher is the one application that can start another, so unlike
		// Preferences and Check for Updates, these have no reason to sit
		// permanently disabled.
		const ids = ['open-terminal', 'open-explorer'];
		for (const id of ids) {
			expect(items().find((item) => item.id === id)?.disabled).toBeFalsy();
		}
	});

	test('opening Terminal runs the operation it names', () => {
		const state = launch();
		items(tray(), state)
			.find((item) => item.id === 'open-terminal')
			?.onSelect();

		expect(state.openTerminal).toHaveBeenCalledTimes(1);
		expect(state.openExplorer).not.toHaveBeenCalled();
	});

	test('opening Explorer runs the operation it names', () => {
		const state = launch();
		items(tray(), state)
			.find((item) => item.id === 'open-explorer')
			?.onSelect();

		expect(state.openExplorer).toHaveBeenCalledTimes(1);
		expect(state.openTerminal).not.toHaveBeenCalled();
	});

	test('an item that cannot act yet explains why rather than failing silently', () => {
		for (const item of items()) {
			if (item.disabled) {
				expect(item.unavailableReason).toBeTruthy();
			}
		}
	});

	test('checking for updates leads to a real notice rather than sitting disabled', () => {
		const checkUpdates = items().find((item) => item.id === 'check-updates');

		expect(checkUpdates?.disabled).toBeFalsy();
	});

	test('checking for updates keeps the menu open, unlike an ordinary item', () => {
		// It replaces the menu's own content with a notice in the same window,
		// rather than completing an action — closing the tray out from under it
		// would be jarring.
		const checkUpdates = items().find((item) => item.id === 'check-updates');
		const quit = items().find((item) => item.id === 'quit');

		expect(checkUpdates?.keepOpen).toBe(true);
		expect(quit?.keepOpen).toBeFalsy();
	});

	test('checking for updates runs the operation it names', () => {
		const state = launch();
		items(tray(), state)
			.find((item) => item.id === 'check-updates')
			?.onSelect();

		expect(state.showUpdateNotice).toHaveBeenCalledTimes(1);
	});
});
