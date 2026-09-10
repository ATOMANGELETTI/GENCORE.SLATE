import { describe, expect, mock, test } from 'bun:test';
import { render, screen, userEvent } from '@slate/testing';

import { Switch } from '../../src/switch/switch.component.tsx';

describe('Switch', () => {
	test('is announced as a switch, not as a button', () => {
		render(<Switch label="Reduce motion" />);

		expect(screen.getByRole('switch', { name: 'Reduce motion' })).toBeDefined();
	});

	test('reports its state', () => {
		render(<Switch label="Reduce motion" checked onCheckedChange={() => {}} />);

		expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true');
	});

	test('reports a change when toggled', () => {
		const onCheckedChange = mock(() => {});
		render(<Switch label="Reduce motion" checked={false} onCheckedChange={onCheckedChange} />);

		userEvent.click(screen.getByRole('switch'));

		expect(onCheckedChange).toHaveBeenCalledWith(true);
	});

	test('does not toggle while disabled', () => {
		const onCheckedChange = mock(() => {});
		render(
			<Switch label="Reduce motion" disabled checked={false} onCheckedChange={onCheckedChange} />,
		);

		userEvent.click(screen.getByRole('switch'));

		expect(onCheckedChange).not.toHaveBeenCalled();
	});

	test('merges a caller className rather than dropping it', () => {
		render(<Switch label="Reduce motion" className="ml-auto" />);

		expect(screen.getByRole('switch').className).toContain('ml-auto');
	});
});
