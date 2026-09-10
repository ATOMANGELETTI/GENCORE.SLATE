import { describe, expect, mock, test } from 'bun:test';
import { SearchIcon } from '@slate/icons';
import { fireEvent, render, screen } from '@slate/testing';

import { TextField } from '../../src/text-field/text-field.component.tsx';

describe('TextField', () => {
	test('associates its visible label with the input', () => {
		// Without the association, clicking the label does nothing and a screen
		// reader announces an unnamed edit box.
		render(<TextField label="Working directory" />);

		expect(screen.getByLabelText('Working directory').tagName).toBe('INPUT');
	});

	test('keeps the name when the label is hidden', () => {
		render(<TextField label="Search apps" isLabelHidden />);

		expect(screen.getByLabelText('Search apps')).toBeDefined();
		expect(screen.queryByText('Search apps')).toBeNull();
	});

	test('reports what the user typed', () => {
		const onChange = mock(() => {});
		render(<TextField label="Search apps" isLabelHidden onChange={onChange} />);

		fireEvent.change(screen.getByLabelText('Search apps'), { target: { value: 'term' } });

		expect(onChange).toHaveBeenCalledTimes(1);
	});

	test('forwards native input props', () => {
		render(
			<TextField label="Search apps" isLabelHidden placeholder="Type to filter" maxLength={40} />,
		);
		const input = screen.getByLabelText('Search apps');

		expect(input.getAttribute('placeholder')).toBe('Type to filter');
		expect(input.getAttribute('maxlength')).toBe('40');
	});

	test('a caller id wins over the generated one', () => {
		// Two fields with the same label would otherwise collide on the
		// generated id and steal each other's label association.
		render(<TextField label="Search apps" id="command-bar" />);

		expect(screen.getByLabelText('Search apps').getAttribute('id')).toBe('command-bar');
	});

	test('hides the decorative glyph from assistive technology', () => {
		const { container } = render(<TextField label="Search apps" isLabelHidden icon={SearchIcon} />);

		expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
	});

	test('renders trailing content', () => {
		render(<TextField label="Search apps" isLabelHidden trailing={<span>16</span>} />);

		expect(screen.getByText('16')).toBeDefined();
	});

	test('merges a caller className rather than dropping it', () => {
		const { container } = render(<TextField label="Search apps" className="mb-4" />);

		expect(container.firstElementChild?.className).toContain('mb-4');
	});
});
