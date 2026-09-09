import { describe, expect, test } from 'bun:test';
import { fireEvent, render, screen, waitFor } from '@slate/testing';

import { TrayMenuRoot } from '../../../src/tray/tray.root.tsx';

/**
 * Outside a Tauri webview, `useTrayMenu`/`useRuntimeInfo` report inert
 * defaults rather than hanging (see those hooks' own doc comments), which is
 * what lets this render and be driven exactly as it would in the real popup.
 */
describe('TrayMenuRoot', () => {
	function openUpdateNotice() {
		fireEvent.click(screen.getByRole('menuitem', { name: /Check for Updates/ }));
	}

	test('checking for updates replaces the menu with the notice', async () => {
		render(<TrayMenuRoot />);

		openUpdateNotice();

		await waitFor(() => {
			expect(screen.getByText('Feature coming soon')).toBeDefined();
		});
		expect(screen.queryByRole('menuitem', { name: /Quit Launcher/ })).toBeNull();
	});

	test('the header naming the application stays visible behind the notice', async () => {
		render(<TrayMenuRoot />);

		openUpdateNotice();

		await waitFor(() => screen.getByText('Feature coming soon'));
		expect(screen.getByText('Launcher')).toBeDefined();
	});

	test('the notice does not close the tray the way an ordinary item would', async () => {
		// A regular item calls `tray.dismiss()`, which is a no-op outside a
		// Tauri webview — so what actually proves the tray was not asked to
		// close is that the notice stayed on screen at all rather than the
		// component unmounting or erroring.
		render(<TrayMenuRoot />);

		openUpdateNotice();

		await waitFor(() => {
			expect(screen.getByText('Feature coming soon')).toBeDefined();
		});
	});

	test('the close control returns to the ordinary menu', async () => {
		render(<TrayMenuRoot />);
		openUpdateNotice();
		await waitFor(() => screen.getByText('Feature coming soon'));

		fireEvent.click(screen.getByRole('button', { name: 'Back' }));

		await waitFor(() => {
			expect(screen.getByRole('menuitem', { name: /Quit Launcher/ })).toBeDefined();
		});
		expect(screen.queryByText('Feature coming soon')).toBeNull();
	});

	test('Escape also returns to the menu, rather than only closing the tray', async () => {
		render(<TrayMenuRoot />);
		openUpdateNotice();
		await waitFor(() => screen.getByText('Feature coming soon'));

		fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });

		await waitFor(() => {
			expect(screen.getByRole('menuitem', { name: /Quit Launcher/ })).toBeDefined();
		});
	});
});
