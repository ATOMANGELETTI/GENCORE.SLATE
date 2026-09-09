import { describe, expect, test } from 'bun:test';
import { fireEvent, render, screen } from '@slate/testing';

import { MenuSurface } from '../../src/menu/menu-surface.component.tsx';

describe('MenuSurface', () => {
	test('suppresses the native context menu', () => {
		// The tray popup renders this with no Radix `ContextMenu` around it —
		// there is no trigger, the window *is* the menu — so without its own
		// default, right-clicking the popup falls through to the browser's menu.
		render(
			<MenuSurface data-testid="surface">
				<div>Item</div>
			</MenuSurface>,
		);

		const event = fireEvent.contextMenu(screen.getByTestId('surface'));

		expect(event).toBe(false);
	});

	test('a caller-supplied handler still wins', () => {
		let called = false;
		render(
			<MenuSurface
				data-testid="surface"
				onContextMenu={() => {
					called = true;
				}}
			>
				<div>Item</div>
			</MenuSurface>,
		);

		fireEvent.contextMenu(screen.getByTestId('surface'));

		expect(called).toBe(true);
	});
});
