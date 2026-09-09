import { describe, expect, mock, test } from 'bun:test';
import type { WindowChrome } from '@slate/ipc';
import { isSeparator, type MenuItemDescriptor } from '@slate/ui-kit';

import { buildTitlebarContextMenu } from '../../../src/context-menu/titlebar.context-menu.ts';

function chrome(overrides: Partial<WindowChrome> = {}): WindowChrome {
	return {
		isMaximized: false,
		isFocused: true,
		visibility: 'visible',
		isAlwaysOnTop: false,
		close: mock(() => {}),
		minimize: mock(() => {}),
		toggleMaximize: mock(() => {}),
		hide: mock(() => {}),
		show: mock(() => {}),
		setAlwaysOnTop: mock(() => {}),
		...overrides,
	};
}

/** The items, without the rules between them. */
function items(chromeState = chrome()): MenuItemDescriptor[] {
	return buildTitlebarContextMenu(chromeState).filter(
		(entry): entry is MenuItemDescriptor => !isSeparator(entry),
	);
}

function byId(id: string, chromeState = chrome()): MenuItemDescriptor | undefined {
	return items(chromeState).find((item) => item.id === id);
}

describe('the Terminal title-bar menu', () => {
	test('offers the window operations custom chrome removed', () => {
		// Without this menu a right-click on the title bar does nothing at all,
		// where every other Windows application shows the system menu.
		const ids = items().map((item) => item.id);

		expect(ids).toContain('minimise');
		expect(ids).toContain('toggle-maximise');
		expect(ids).toContain('close');
	});

	test('the zoom item names the action it will perform', () => {
		expect(byId('toggle-maximise')?.label).toBe('Zoom');
		expect(byId('toggle-maximise', chrome({ isMaximized: true }))?.label).toBe('Restore');
	});

	test('minimising is unavailable when the window is already minimised', () => {
		expect(byId('minimise', chrome({ visibility: 'minimized' }))?.disabled).toBe(true);
		expect(byId('minimise')?.disabled).toBeFalsy();
	});

	test('always-on-top reports its current state', () => {
		// `isChecked: false` rather than absent: an item that can be checked and
		// currently is not has to say so, or its off state is never announced.
		expect(byId('always-on-top')?.isChecked).toBe(false);
		expect(byId('always-on-top', chrome({ isAlwaysOnTop: true }))?.isChecked).toBe(true);
	});

	test('always-on-top toggles rather than always enabling', () => {
		const pinned = chrome({ isAlwaysOnTop: true });
		byId('always-on-top', pinned)?.onSelect();

		expect(pinned.setAlwaysOnTop).toHaveBeenCalledWith(false);
	});

	test('closing is marked destructive', () => {
		expect(byId('close')?.tone).toBe('danger');
	});

	test('each item runs the operation it names', () => {
		const state = chrome();
		byId('minimise', state)?.onSelect();
		byId('close', state)?.onSelect();
		byId('hide', state)?.onSelect();

		expect(state.minimize).toHaveBeenCalledTimes(1);
		expect(state.close).toHaveBeenCalledTimes(1);
		expect(state.hide).toHaveBeenCalledTimes(1);
	});

	test('groups are separated by rules rather than by blank items', () => {
		const menu = buildTitlebarContextMenu(chrome());

		expect(menu.filter(isSeparator).length).toBeGreaterThan(0);
		// A trailing rule would draw a line under nothing.
		expect(isSeparator(menu[menu.length - 1]!)).toBe(false);
		expect(isSeparator(menu[0]!)).toBe(false);
	});
});
