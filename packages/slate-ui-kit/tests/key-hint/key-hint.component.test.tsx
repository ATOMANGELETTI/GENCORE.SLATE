import { describe, expect, test } from 'bun:test';
import { render, screen } from '@slate/testing';

import { KeyHint } from '../../src/key-hint/key-hint.component.tsx';

describe('KeyHint', () => {
	test('renders the keys and what they do', () => {
		render(<KeyHint keys={['TAB']}>Complete</KeyHint>);

		expect(screen.getByText('TAB')).toBeDefined();
		expect(screen.getByText('Complete')).toBeDefined();
	});

	test('marks each key up as a key', () => {
		// `<kbd>` is what tells a screen reader this is a keystroke rather than
		// a stray three-letter word in the middle of a sentence.
		render(<KeyHint keys={['ESC']}>Exit</KeyHint>);

		expect(screen.getByText('ESC').tagName).toBe('KBD');
	});

	test('renders a pair of keys as two separate caps', () => {
		render(<KeyHint keys={['↑', '↓']}>Select</KeyHint>);

		expect(screen.getByText('↑').tagName).toBe('KBD');
		expect(screen.getByText('↓').tagName).toBe('KBD');
	});

	test('merges a caller className rather than dropping it', () => {
		const { container } = render(
			<KeyHint keys={['ESC']} className="ml-auto">
				Exit
			</KeyHint>,
		);

		expect(container.firstElementChild?.className).toContain('ml-auto');
	});
});
