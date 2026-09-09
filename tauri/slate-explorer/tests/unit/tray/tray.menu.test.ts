import { describe, expect, mock, test } from 'bun:test';
import type { TrayMenu } from '@slate/ipc';
import { isSeparator, type MenuItemDescriptor } from '@slate/ui-kit';

import { buildTrayMenu } from '../../../src/tray/tray.menu.ts';

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

function items(state = tray()): MenuItemDescriptor[] {
	return buildTrayMenu(state).filter((entry): entry is MenuItemDescriptor => !isSeparator(entry));
}

describe('the Explorer tray menu', () => {
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
		expect(quit?.label).toBe('Quit Explorer');
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

	test('an item that cannot act yet explains why rather than failing silently', () => {
		for (const item of items()) {
			if (item.disabled) {
				expect(item.unavailableReason).toBeTruthy();
			}
		}
	});
});
