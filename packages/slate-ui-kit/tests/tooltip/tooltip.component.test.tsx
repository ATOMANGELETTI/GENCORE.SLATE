import { describe, expect, test } from 'bun:test';
import { render, screen } from '@slate/testing';

import { Button } from '../../src/button/button.component.tsx';
import { Tooltip, TooltipProvider } from '../../src/tooltip/tooltip.component.tsx';

/**
 * A tooltip's own appearance is Radix's job and is driven by pointer timers
 * that a DOM shim cannot honestly simulate. What is worth pinning here is the
 * contract the kit owns: the trigger stays the caller's element, keeps working,
 * and keeps the accessible name it already had.
 */
describe('Tooltip', () => {
	test('renders its trigger', () => {
		render(
			<TooltipProvider>
				<Tooltip content="Settings">
					<Button aria-label="Settings" />
				</Tooltip>
			</TooltipProvider>,
		);

		expect(screen.getByRole('button', { name: 'Settings' })).toBeDefined();
	});

	test('does not replace the trigger with a wrapper element', () => {
		// `asChild` is what keeps the caller's button a button. Losing it would
		// nest a button inside a button, which is invalid and unfocusable.
		render(
			<TooltipProvider>
				<Tooltip content="Settings">
					<Button aria-label="Settings" />
				</Tooltip>
			</TooltipProvider>,
		);

		expect(screen.getByRole('button').tagName).toBe('BUTTON');
	});

	test('the tooltip is not in the document until it is triggered', () => {
		render(
			<TooltipProvider>
				<Tooltip content="Open settings">
					<Button aria-label="Settings" />
				</Tooltip>
			</TooltipProvider>,
		);

		expect(screen.queryByText('Open settings')).toBeNull();
	});
});
