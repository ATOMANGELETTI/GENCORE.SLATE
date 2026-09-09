import { describe, expect, mock, test } from 'bun:test';
import { fireEvent, render, screen, waitFor } from '@slate/testing';

import { Dialog } from '../../src/dialog/dialog.component.tsx';

/**
 * These test what a caller can observe — dismissal, focus, and the accessible
 * name — not which Tailwind classes appear.
 */
describe('Dialog', () => {
	test('renders nothing while closed', () => {
		render(
			<Dialog open={false} onOpenChange={() => {}} title="About Launcher">
				<p>Content</p>
			</Dialog>,
		);

		expect(screen.queryByRole('dialog')).toBeNull();
	});

	test('shows its content while open, under the given accessible name', () => {
		render(
			<Dialog open onOpenChange={() => {}} title="About Launcher">
				<p>Content</p>
			</Dialog>,
		);

		expect(screen.getByRole('dialog', { name: 'About Launcher' })).toBeDefined();
		expect(screen.getByText('Content')).toBeDefined();
	});

	test('calls back with false when the close control is chosen', () => {
		const onOpenChange = mock(() => {});
		render(
			<Dialog open onOpenChange={onOpenChange} title="About Launcher">
				<p>Content</p>
			</Dialog>,
		);

		fireEvent.click(screen.getByRole('button', { name: 'Close' }));

		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	test('calls back with false on Escape', async () => {
		const onOpenChange = mock(() => {});
		render(
			<Dialog open onOpenChange={onOpenChange} title="About Launcher">
				<p>Content</p>
			</Dialog>,
		);

		fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

		await waitFor(() => {
			expect(onOpenChange).toHaveBeenCalledWith(false);
		});
	});
});
