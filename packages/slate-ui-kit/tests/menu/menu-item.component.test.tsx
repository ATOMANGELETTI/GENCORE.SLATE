import { describe, expect, test } from 'bun:test';
import { SettingsIcon } from '@slate/icons';
import { render, screen } from '@slate/testing';
import type { MenuItemDescriptor } from '../../src/menu/menu.types.ts';
import { MenuItem } from '../../src/menu/menu-item.component.tsx';

/**
 * These test what a caller can observe, not which Tailwind classes appear.
 * Asserting on class strings tests the styling library rather than the
 * component.
 */

function makeItem(overrides: Partial<MenuItemDescriptor> = {}): MenuItemDescriptor {
	return {
		id: 'preferences',
		label: 'Preferences',
		onSelect: () => {},
		...overrides,
	};
}

describe('MenuItem', () => {
	test('renders its label under the menuitem role', () => {
		render(<MenuItem item={makeItem()} />);

		expect(screen.getByRole('menuitem', { name: /Preferences/ })).toBeDefined();
	});

	test('shows the keyboard shortcut alongside the label', () => {
		render(<MenuItem item={makeItem({ shortcut: 'Ctrl+,' })} />);

		expect(screen.getByText('Ctrl+,')).toBeDefined();
	});

	test('omits the shortcut entirely when there is none', () => {
		render(<MenuItem item={makeItem()} />);

		// An empty shortcut slot still occupies width and pushes labels around.
		expect(screen.queryByText('Ctrl+,')).toBeNull();
	});

	test('announces itself as disabled', () => {
		render(<MenuItem item={makeItem({ disabled: true })} />);

		expect(screen.getByRole('menuitem').getAttribute('aria-disabled')).toBe('true');
	});

	test('explains why a disabled item is unavailable', () => {
		// A greyed item with no explanation is the most common way a menu
		// wastes somebody's time.
		render(
			<MenuItem
				item={makeItem({ disabled: true, unavailableReason: 'The Terminal is not installed yet' })}
			/>,
		);

		expect(screen.getByRole('menuitem').getAttribute('title')).toBe(
			'The Terminal is not installed yet',
		);
	});

	test('does not claim a checked state when it is not checkable', () => {
		render(<MenuItem item={makeItem()} />);

		// `aria-checked` is only meaningful on a checkbox role, and a plain item
		// that carries it announces a state it does not have.
		expect(screen.getByRole('menuitem').getAttribute('aria-checked')).toBeNull();
	});

	test('takes the checkbox role once it is checkable at all', () => {
		render(<MenuItem item={makeItem({ isChecked: false })} />);

		// Checkable-and-off is not the same as not-checkable: without the
		// checkbox role, the off state is never announced.
		expect(screen.getByRole('menuitemcheckbox').getAttribute('aria-checked')).toBe('false');
	});

	test('announces a checked item', () => {
		render(<MenuItem item={makeItem({ isChecked: true })} />);

		expect(screen.getByRole('menuitemcheckbox').getAttribute('aria-checked')).toBe('true');
	});

	test('every item is programmatically focusable', () => {
		// A menu is a roving-tabindex widget: arrow keys move focus between
		// items, so each has to be a focus target even when it is not tabbable.
		render(<MenuItem item={makeItem()} />);

		expect(screen.getByRole('menuitem').getAttribute('tabindex')).toBe('-1');
	});

	test('renders a leading icon without announcing it', () => {
		const { container } = render(<MenuItem item={makeItem({ icon: SettingsIcon })} />);

		// The label already names the action; a second announcement is noise.
		const svg = container.querySelector('svg');
		expect(svg?.getAttribute('aria-hidden')).toBe('true');
	});

	test('the label remains the accessible name for a danger item', () => {
		// Tone is colour, and colour must never be the only carrier of meaning.
		render(<MenuItem item={makeItem({ label: 'Quit Launcher', tone: 'danger' })} />);

		expect(screen.getByRole('menuitem', { name: /Quit Launcher/ })).toBeDefined();
	});
});
