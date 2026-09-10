import { describe, expect, mock, test } from 'bun:test';
import { render, screen, userEvent } from '@slate/testing';

import { SegmentedControl } from '../../src/segmented-control/segmented-control.component.tsx';

const THEMES = [
	{ value: 'system', label: 'System' },
	{ value: 'light', label: 'Light' },
	{ value: 'dark', label: 'Dark' },
];

describe('SegmentedControl', () => {
	test('names the group as a whole, and announces it as a radio group', () => {
		// Single-select is a radio group, not a toolbar of independent toggles —
		// which is what tells a screen reader user that picking one unpicks the
		// others rather than adding to a set.
		render(<SegmentedControl label="Theme" items={THEMES} value="dark" onValueChange={() => {}} />);

		expect(screen.getByRole('radiogroup', { name: 'Theme' })).toBeDefined();
	});

	test('renders every option, so the alternatives are visible', () => {
		render(<SegmentedControl label="Theme" items={THEMES} value="dark" onValueChange={() => {}} />);

		for (const { label } of THEMES) {
			expect(screen.getByRole('radio', { name: label })).toBeDefined();
		}
	});

	test('marks only the active option as selected', () => {
		render(<SegmentedControl label="Theme" items={THEMES} value="dark" onValueChange={() => {}} />);

		expect(screen.getByRole('radio', { name: 'Dark' }).getAttribute('aria-checked')).toBe('true');
		expect(screen.getByRole('radio', { name: 'Light' }).getAttribute('aria-checked')).toBe('false');
	});

	test('reports the option the user picked', () => {
		const onValueChange = mock(() => {});
		render(
			<SegmentedControl label="Theme" items={THEMES} value="dark" onValueChange={onValueChange} />,
		);

		userEvent.click(screen.getByRole('radio', { name: 'Light' }));

		expect(onValueChange).toHaveBeenCalledWith('light');
	});

	test('pressing the active option does not empty the setting', () => {
		// Radix reports '' when the pressed item was already on. Passing that
		// through would let a click clear a setting that has no "unset" state.
		const onValueChange = mock(() => {});
		render(
			<SegmentedControl label="Theme" items={THEMES} value="dark" onValueChange={onValueChange} />,
		);

		userEvent.click(screen.getByRole('radio', { name: 'Dark' }));

		expect(onValueChange).not.toHaveBeenCalled();
	});
});
