import { describe, expect, mock, test } from 'bun:test';

import { buildTitlebarContextMenu } from '../../../src/context-menu/titlebar.context-menu.ts';

/**
 * The title-bar context menu is the keyboard- and habit-accessible path to the
 * window controls. Custom chrome removes the system menu that would normally
 * answer a right-click, so this rebuilds the useful half of it — and these
 * tests make sure it keeps working.
 */
function chrome(overrides: Partial<{ isMaximized: boolean; isMinimized: boolean }> = {}) {
	return {
		isMaximized: false,
		isFocused: true,
		isMinimized: false,
		close: mock(() => {}),
		minimize: mock(() => {}),
		toggleMaximize: mock(() => {}),
		...overrides,
	};
}

describe('Launcher title-bar context menu', () => {
	test('offers minimise, zoom, and close', () => {
		const items = buildTitlebarContextMenu(chrome());

		expect(items.map((item) => item.id)).toEqual(['minimize', 'toggle-maximize', 'close']);
	});

	test('labels the zoom entry for the current window state', () => {
		expect(buildTitlebarContextMenu(chrome()).at(1)?.label).toBe('Zoom');
		expect(buildTitlebarContextMenu(chrome({ isMaximized: true })).at(1)?.label).toBe('Restore');
	});

	test('disables minimise when the window is already minimised', () => {
		expect(buildTitlebarContextMenu(chrome({ isMinimized: true })).at(0)?.disabled).toBe(true);
	});

	test('separates close from the rest', () => {
		// Destructive actions should not sit flush against the ones above them.
		const close = buildTitlebarContextMenu(chrome()).at(2);

		expect(close?.separatorBefore).toBe(true);
	});

	test('each entry invokes its own handler', () => {
		const handlers = chrome();
		for (const item of buildTitlebarContextMenu(handlers)) {
			item.action();
		}

		expect(handlers.minimize).toHaveBeenCalledTimes(1);
		expect(handlers.toggleMaximize).toHaveBeenCalledTimes(1);
		expect(handlers.close).toHaveBeenCalledTimes(1);
	});
});
