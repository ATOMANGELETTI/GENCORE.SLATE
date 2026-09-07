import { describe, expect, mock, test } from 'bun:test';
import { render, screen, userEvent } from '@slate/testing';

import { Button } from '../../src/button/button.component.tsx';

/**
 * These test what a caller can observe, not which Tailwind classes appear.
 * Asserting on class strings tests the styling library rather than the
 * component, and breaks on every refactor without catching a real defect.
 */
describe('Button', () => {
	test('renders its content', () => {
		render(<Button>Launch</Button>);

		expect(screen.getByRole('button', { name: 'Launch' })).toBeDefined();
	});

	test('defaults to type="button"', () => {
		// A button inside a form defaults to type="submit" in HTML, which
		// submits the form on every click. Almost never what is wanted.
		render(<Button>Launch</Button>);

		expect(screen.getByRole('button').getAttribute('type')).toBe('button');
	});

	test('calls its handler when clicked', () => {
		const onClick = mock(() => {});
		render(<Button onClick={onClick}>Launch</Button>);

		userEvent.click(screen.getByRole('button'));

		expect(onClick).toHaveBeenCalledTimes(1);
	});

	test('does not call its handler while disabled', () => {
		const onClick = mock(() => {});
		render(
			<Button disabled onClick={onClick}>
				Launch
			</Button>,
		);

		userEvent.click(screen.getByRole('button'));

		expect(onClick).not.toHaveBeenCalled();
	});

	test('merges a caller className rather than dropping it', () => {
		// A component that swallows className cannot be composed, which would
		// force every layout tweak into the kit itself.
		render(<Button className="w-full">Launch</Button>);

		expect(screen.getByRole('button').className).toContain('w-full');
	});

	test('forwards arbitrary native props', () => {
		render(<Button aria-label="Launch Terminal" data-testid="launch" />);

		expect(screen.getByLabelText('Launch Terminal')).toBeDefined();
		expect(screen.getByTestId('launch')).toBeDefined();
	});

	test('every variant and size renders', () => {
		const variants = ['primary', 'secondary', 'ghost', 'danger'] as const;
		const sizes = ['sm', 'md', 'lg', 'icon'] as const;

		for (const variant of variants) {
			for (const size of sizes) {
				const { unmount } = render(
					<Button variant={variant} size={size} aria-label={`${variant}-${size}`} />,
				);
				expect(screen.getByLabelText(`${variant}-${size}`)).toBeDefined();
				unmount();
			}
		}
	});

	test('accepts a ref without a forwardRef wrapper', () => {
		// React 19 treats ref as an ordinary prop; this pins that the kit is
		// written against 19 rather than carrying legacy wrappers.
		let element: HTMLButtonElement | null = null;
		render(
			<Button
				ref={(node) => {
					element = node;
				}}
			>
				Launch
			</Button>,
		);

		expect(element).not.toBeNull();
	});
});
