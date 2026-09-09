import { describe, expect, test } from 'bun:test';
import { fireEvent, render, screen } from '@slate/testing';

import { AppShell } from '../../src/app-shell/app-shell.component.tsx';

function noop() {}

describe('AppShell', () => {
	test('suppresses the native context menu on the status bar', () => {
		// The status bar is not wrapped in its own `ContextMenu` the way the
		// title bar and content area are, so without a default at this level a
		// right-click here fell through to the browser's own menu — Back,
		// Refresh, Save As, Inspect — none of which apply to a desktop window.
		render(
			<AppShell
				title="Launcher"
				isFocused
				onClose={noop}
				onMinimize={noop}
				onToggleMaximize={noop}
				status={{ leading: 'Ready' }}
			>
				<div>Content</div>
			</AppShell>,
		);

		const event = fireEvent.contextMenu(screen.getByRole('contentinfo'));

		// `fireEvent` returns whether the event's default action was *not*
		// prevented, so `false` here means it was — the assertion this test
		// exists to pin down.
		expect(event).toBe(false);
	});
});
