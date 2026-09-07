import { describe, expect, mock, test } from 'bun:test';
import { render, screen, userEvent } from '@slate/testing';

import { TitleBar } from '../../src/title-bar/title-bar.component.tsx';
import { TrafficLights } from '../../src/title-bar/traffic-lights.component.tsx';

/**
 * The title bar is the most recognisable part of the suite's identity, and the
 * only chrome the user has for controlling a window — Windows' own is turned
 * off. These tests pin the behaviour that would be embarrassing to lose.
 */

function chromeHandlers() {
	return {
		onClose: mock(() => {}),
		onMinimize: mock(() => {}),
		onToggleMaximize: mock(() => {}),
	};
}

describe('TitleBar', () => {
	test('renders the title', () => {
		render(<TitleBar title="Launcher" isFocused {...chromeHandlers()} />);

		expect(screen.getByText('Launcher')).toBeDefined();
	});

	test('each window control is reachable by its accessible name', () => {
		// Icon-only controls with no accessible name are invisible to a screen
		// reader, which would leave the window uncontrollable for anyone using
		// one — the system title bar that would normally provide a fallback is
		// switched off.
		render(<TitleBar title="Launcher" isFocused {...chromeHandlers()} />);

		expect(screen.getByRole('button', { name: 'Close window' })).toBeDefined();
		expect(screen.getByRole('button', { name: 'Minimise window' })).toBeDefined();
		expect(screen.getByRole('button', { name: 'Zoom window' })).toBeDefined();
	});

	test('the zoom control is labelled "Restore" once the window is zoomed', () => {
		render(<TitleBar title="Launcher" isFocused isMaximized {...chromeHandlers()} />);

		expect(screen.getByRole('button', { name: 'Restore window' })).toBeDefined();
	});

	test('each control calls its own handler', () => {
		const handlers = chromeHandlers();
		render(<TitleBar title="Launcher" isFocused {...handlers} />);

		userEvent.click(screen.getByRole('button', { name: 'Close window' }));
		userEvent.click(screen.getByRole('button', { name: 'Minimise window' }));
		userEvent.click(screen.getByRole('button', { name: 'Zoom window' }));

		expect(handlers.onClose).toHaveBeenCalledTimes(1);
		expect(handlers.onMinimize).toHaveBeenCalledTimes(1);
		expect(handlers.onToggleMaximize).toHaveBeenCalledTimes(1);
	});

	test('double-clicking the bar zooms the window', () => {
		// Long-standing platform behaviour that users reach for without
		// thinking, and easy to drop when the bar is custom-drawn.
		const handlers = chromeHandlers();
		const { container } = render(<TitleBar title="Launcher" isFocused {...handlers} />);

		const bar = container.querySelector('header');
		expect(bar).not.toBeNull();
		userEvent.doubleClick(bar as Element);

		expect(handlers.onToggleMaximize).toHaveBeenCalledTimes(1);
	});

	test('the bar is a drag region, but the controls are not', () => {
		// Without this, the buttons move the window instead of responding.
		const { container } = render(<TitleBar title="Launcher" isFocused {...chromeHandlers()} />);

		const bar = container.querySelector('header');
		expect(bar?.hasAttribute('data-tauri-drag-region')).toBe(true);

		const controls = container.querySelector('[data-tauri-drag-region="false"]');
		expect(controls).not.toBeNull();
	});

	test('renders application actions in the trailing slot', () => {
		render(
			<TitleBar
				title="Launcher"
				isFocused
				{...chromeHandlers()}
				actions={<button type="button">Settings</button>}
			/>,
		);

		expect(screen.getByRole('button', { name: 'Settings' })).toBeDefined();
	});
});

describe('TrafficLights', () => {
	test('carry colour while focused', () => {
		const { container } = render(<TrafficLights isFocused {...chromeHandlers()} />);

		const close = container.querySelector('[aria-label="Close window"]') as HTMLElement;
		expect(close.style.backgroundColor).toBe('var(--slate-chrome-close)');
	});

	test('desaturate to grey when the window loses focus', () => {
		// The detail that makes the chrome read as deliberate rather than as an
		// approximation of the platform it borrows from.
		const { container } = render(<TrafficLights isFocused={false} {...chromeHandlers()} />);

		for (const label of ['Close window', 'Minimise window', 'Zoom window']) {
			const control = container.querySelector(`[aria-label="${label}"]`) as HTMLElement;
			expect(control.style.backgroundColor).toBe('var(--slate-chrome-inactive)');
		}
	});

	test('are ordered close, minimise, zoom', () => {
		const { container } = render(<TrafficLights isFocused {...chromeHandlers()} />);

		const labels = [...container.querySelectorAll('button')].map((button) =>
			button.getAttribute('aria-label'),
		);

		expect(labels).toEqual(['Close window', 'Minimise window', 'Zoom window']);
	});
});
