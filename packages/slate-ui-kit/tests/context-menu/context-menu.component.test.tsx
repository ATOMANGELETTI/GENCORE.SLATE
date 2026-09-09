import { describe, expect, mock, test } from 'bun:test';
import { fireEvent, render, screen, waitFor } from '@slate/testing';

import { ContextMenu } from '../../src/context-menu/context-menu.component.tsx';
import type { MenuEntry } from '../../src/menu/menu.types.ts';

/**
 * The suite draws its own chrome, so right-clicking anywhere in a window would
 * otherwise do nothing at all. These pin the contract that keeps the menus
 * usable rather than the styling.
 */

function openMenuOn(element: Element) {
	// Radix listens for `contextmenu`, which `userEvent.click` does not emit.
	fireEvent.contextMenu(element);
}

describe('ContextMenu', () => {
	const entries = (onSelect: () => void): MenuEntry[] => [
		{ id: 'minimise', label: 'Minimise', shortcut: 'Ctrl+M', onSelect },
		{ id: 'sep', kind: 'separator' },
		{ id: 'close', label: 'Close', tone: 'danger', onSelect: () => {} },
	];

	test('stays closed until the region is right-clicked', () => {
		render(
			<ContextMenu label="Window" entries={entries(() => {})}>
				<div>Title bar</div>
			</ContextMenu>,
		);

		expect(screen.queryByRole('menu')).toBeNull();
	});

	test('opens on right-click and shows its items', async () => {
		render(
			<ContextMenu label="Window" entries={entries(() => {})}>
				<div>Title bar</div>
			</ContextMenu>,
		);

		openMenuOn(screen.getByText('Title bar'));

		await waitFor(() => {
			expect(screen.getByRole('menu', { name: 'Window' })).toBeDefined();
		});
		expect(screen.getByRole('menuitem', { name: /Minimise/ })).toBeDefined();
	});

	test('runs an item handler when it is chosen', async () => {
		const onSelect = mock(() => {});
		render(
			<ContextMenu label="Window" entries={entries(onSelect)}>
				<div>Title bar</div>
			</ContextMenu>,
		);

		openMenuOn(screen.getByText('Title bar'));
		await waitFor(() => screen.getByRole('menuitem', { name: /Minimise/ }));

		fireEvent.click(screen.getByRole('menuitem', { name: /Minimise/ }));

		await waitFor(() => {
			expect(onSelect).toHaveBeenCalledTimes(1);
		});
	});

	test('separates groups with a rule rather than a menu item', async () => {
		render(
			<ContextMenu label="Window" entries={entries(() => {})}>
				<div>Title bar</div>
			</ContextMenu>,
		);

		openMenuOn(screen.getByText('Title bar'));
		await waitFor(() => screen.getByRole('menu'));

		// A separator announced as a choice is a choice that does nothing.
		expect(screen.getAllByRole('menuitem')).toHaveLength(2);
		expect(screen.getAllByRole('separator')).toHaveLength(1);
	});

	test('closes on Escape', async () => {
		render(
			<ContextMenu label="Window" entries={entries(() => {})}>
				<div>Title bar</div>
			</ContextMenu>,
		);

		openMenuOn(screen.getByText('Title bar'));
		await waitFor(() => screen.getByRole('menu'));

		fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });

		await waitFor(() => {
			expect(screen.queryByRole('menu')).toBeNull();
		});
	});

	test('does not run a disabled item', async () => {
		const onSelect = mock(() => {});
		render(
			<ContextMenu
				label="Window"
				entries={[{ id: 'zoom', label: 'Zoom', disabled: true, onSelect }]}
			>
				<div>Title bar</div>
			</ContextMenu>,
		);

		openMenuOn(screen.getByText('Title bar'));
		await waitFor(() => screen.getByRole('menu'));

		fireEvent.click(screen.getByRole('menuitem', { name: /Zoom/ }));

		expect(onSelect).not.toHaveBeenCalled();
	});
});
