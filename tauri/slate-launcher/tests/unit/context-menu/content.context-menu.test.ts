import { describe, expect, mock, test } from 'bun:test';
import type { WebviewZoom } from '@slate/ipc';
import { isSeparator, type MenuItemDescriptor } from '@slate/ui-kit';

import { buildContentContextMenu } from '../../../src/context-menu/content.context-menu.ts';
import { buildTitlebarContextMenu } from '../../../src/context-menu/titlebar.context-menu.ts';

function zoom(overrides: Partial<WebviewZoom> = {}): WebviewZoom {
	return {
		factor: 1,
		zoomIn: mock(() => {}),
		zoomOut: mock(() => {}),
		reset: mock(() => {}),
		canZoomIn: true,
		canZoomOut: true,
		...overrides,
	};
}

function menu(
	zoomState = zoom(),
	overrides: { onOpenPreferences?: () => void; onShowAbout?: () => void } = {},
) {
	return buildContentContextMenu({
		zoom: zoomState,
		onOpenPreferences: overrides.onOpenPreferences ?? (() => {}),
		onShowAbout: overrides.onShowAbout ?? (() => {}),
	});
}

function items(
	zoomState = zoom(),
	overrides: { onOpenPreferences?: () => void; onShowAbout?: () => void } = {},
): MenuItemDescriptor[] {
	return menu(zoomState, overrides).filter(
		(entry): entry is MenuItemDescriptor => !isSeparator(entry),
	);
}

describe('the Launcher content menu', () => {
	test('is a different menu from the title bar, not a copy of it', () => {
		// The whole reason for two menus: a right-click that offers the same
		// items wherever it lands tells the user their click carried no meaning.
		const content = new Set(items().map((item) => item.id));
		const titlebar = buildTitlebarContextMenu({
			isMaximized: false,
			isFocused: true,
			visibility: 'visible',
			isAlwaysOnTop: false,
			close: () => {},
			minimize: () => {},
			toggleMaximize: () => {},
			hide: () => {},
			show: () => {},
			setAlwaysOnTop: () => {},
		})
			.filter((entry): entry is MenuItemDescriptor => !isSeparator(entry))
			.map((item) => item.id);

		for (const id of titlebar) {
			expect(content.has(id)).toBe(false);
		}
	});

	test('offers application operations', () => {
		const ids = items().map((item) => item.id);

		expect(ids).toContain('reload');
		expect(ids).toContain('zoom-in');
		expect(ids).toContain('preferences');
		expect(ids).toContain('about');
	});

	test('the about item names this application', () => {
		expect(items().find((item) => item.id === 'about')?.label).toBe('About Launcher');
	});

	test('a zoom step already at its limit is unavailable, and says why', () => {
		const atMaximum = items(zoom({ canZoomIn: false })).find((item) => item.id === 'zoom-in');

		expect(atMaximum?.disabled).toBe(true);
		// A greyed item with no explanation just wastes the reader's time.
		expect(atMaximum?.unavailableReason).toBeTruthy();
	});

	test('resetting is unavailable when already unscaled', () => {
		expect(items().find((item) => item.id === 'zoom-reset')?.disabled).toBe(true);
		expect(items(zoom({ factor: 1.5 })).find((item) => item.id === 'zoom-reset')?.disabled).toBe(
			false,
		);
	});

	test('zooming runs the operation it names', () => {
		const state = zoom();
		items(state)
			.find((item) => item.id === 'zoom-in')
			?.onSelect();

		expect(state.zoomIn).toHaveBeenCalledTimes(1);
	});

	test('preferences and about are always available', () => {
		// Neither has a window of its own, but both do something useful today
		// (reveal the config file; show the About dialog), so neither is ever a
		// disabled dead end.
		for (const id of ['preferences', 'about']) {
			expect(items().find((entry) => entry.id === id)?.disabled).toBeFalsy();
		}
	});

	test('preferences reveals the config file', () => {
		const onOpenPreferences = mock(() => {});
		items(zoom(), { onOpenPreferences })
			.find((item) => item.id === 'preferences')
			?.onSelect();

		expect(onOpenPreferences).toHaveBeenCalledTimes(1);
	});

	test('about shows the dialog', () => {
		const onShowAbout = mock(() => {});
		items(zoom(), { onShowAbout })
			.find((item) => item.id === 'about')
			?.onSelect();

		expect(onShowAbout).toHaveBeenCalledTimes(1);
	});
});
