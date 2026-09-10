import { describe, expect, mock, test } from 'bun:test';
import { FolderIcon } from '@slate/icons';
import { render, screen, userEvent } from '@slate/testing';

import { NavItem } from '../../src/nav-item/nav-item.component.tsx';

/**
 * Behaviour a caller can observe, not which Tailwind classes appear. The one
 * exception is `aria-current`, which is behaviour rather than styling: it is
 * how a screen reader user knows which of a dozen similar rows they are on.
 */
describe('NavItem', () => {
	test('renders its label', () => {
		render(<NavItem label="Downloads" />);

		expect(screen.getByRole('button', { name: 'Downloads' })).toBeDefined();
	});

	test('is a real button, so it is reachable by keyboard', () => {
		render(<NavItem label="Downloads" />);

		expect(screen.getByRole('button').tagName).toBe('BUTTON');
	});

	test('defaults to type="button"', () => {
		render(<NavItem label="Downloads" />);

		expect(screen.getByRole('button').getAttribute('type')).toBe('button');
	});

	test('marks the selected row with aria-current', () => {
		render(<NavItem label="Downloads" isSelected />);

		expect(screen.getByRole('button').getAttribute('aria-current')).toBe('true');
	});

	test('leaves aria-current off an unselected row', () => {
		// Present-but-false would still be announced as current by some
		// screen readers, so the attribute has to be absent rather than "false".
		render(<NavItem label="Downloads" />);

		expect(screen.getByRole('button').hasAttribute('aria-current')).toBe(false);
	});

	test('calls its handler when clicked', () => {
		const onClick = mock(() => {});
		render(<NavItem label="Downloads" onClick={onClick} />);

		userEvent.click(screen.getByRole('button'));

		expect(onClick).toHaveBeenCalledTimes(1);
	});

	test('does not call its handler while disabled', () => {
		const onClick = mock(() => {});
		render(<NavItem label="Downloads" disabled onClick={onClick} />);

		userEvent.click(screen.getByRole('button'));

		expect(onClick).not.toHaveBeenCalled();
	});

	test('renders trailing content beside the label', () => {
		render(<NavItem label="Downloads" trailing={<span>12</span>} />);

		expect(screen.getByRole('button', { name: 'Downloads 12' })).toBeDefined();
	});

	test('hides the decorative glyph from assistive technology', () => {
		// The icon repeats the label. Announcing it would read the row twice.
		const { container } = render(<NavItem label="Downloads" icon={FolderIcon} />);

		expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
	});

	test('uppercase reaches the label and not the trailing slot', () => {
		// A row-wide `uppercase` also catches the trailing slot, where a value
		// usually sits. `STORAGE/DESKTOP` is not the path, and a version in
		// capitals is a version nobody can search for.
		render(<NavItem label="Desktop" isUppercase trailing={<span>storage/desktop</span>} />);

		expect(screen.getByText('Desktop').hasAttribute('data-nav-label')).toBe(true);
		expect(screen.getByText('storage/desktop').hasAttribute('data-nav-label')).toBe(false);
	});

	test('merges a caller className rather than dropping it', () => {
		render(<NavItem label="Downloads" className="mt-4" />);

		expect(screen.getByRole('button').className).toContain('mt-4');
	});
});
