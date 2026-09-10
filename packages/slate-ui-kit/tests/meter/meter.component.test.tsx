import { describe, expect, test } from 'bun:test';
import { render, screen } from '@slate/testing';

import { Meter } from '../../src/meter/meter.component.tsx';

describe('Meter', () => {
	test('announces itself as a measurement rather than as progress', () => {
		// `progressbar` would have a screen reader say "loading" about a disk
		// that is simply 3% full.
		render(<Meter label="Storage used" value={3} max={100} />);

		expect(screen.getByRole('meter', { name: 'Storage used' })).toBeDefined();
	});

	test('exposes the range it is measured against', () => {
		render(<Meter label="Storage used" value={3} max={100} />);
		const meter = screen.getByRole('meter');

		expect(meter.getAttribute('aria-valuenow')).toBe('3');
		expect(meter.getAttribute('aria-valuemin')).toBe('0');
		expect(meter.getAttribute('aria-valuemax')).toBe('100');
	});

	test('carries a human reading of the value when given one', () => {
		// A raw byte count announced aloud is not information.
		render(
			<Meter label="Storage used" value={570368} max={17179869184} valueText="557 KB of 16 GB" />,
		);

		expect(screen.getByRole('meter').getAttribute('aria-valuetext')).toBe('557 KB of 16 GB');
	});

	test('clamps a value above the range', () => {
		// Readings come from the filesystem. A bar drawn 140% wide reads as a
		// rendering fault rather than as a surprising measurement.
		render(<Meter label="Storage used" value={150} max={100} />);

		expect(screen.getByRole('meter').getAttribute('aria-valuenow')).toBe('100');
	});

	test('clamps a negative value', () => {
		render(<Meter label="Storage used" value={-5} max={100} />);

		expect(screen.getByRole('meter').getAttribute('aria-valuenow')).toBe('0');
	});

	test('survives a zero maximum rather than dividing by it', () => {
		render(<Meter label="Storage used" value={0} max={0} />);

		expect(screen.getByRole('meter').getAttribute('aria-valuemax')).toBe('1');
	});

	test('a tiny but non-zero value still draws a mark', () => {
		// 570KB of a 16GB volume is 0.003%, which rounds to no pixels. A bar
		// showing nothing for "a little" is indistinguishable from one showing
		// nothing for "none", which is the distinction it exists to make.
		const { container } = render(<Meter label="Storage used" value={570368} max={17179869184} />);
		const fill = container.querySelector('[role="meter"] > div');

		expect(fill?.className).toContain('min-w-[2px]');
	});

	test('an empty measurement draws nothing at all', () => {
		const { container } = render(<Meter label="Storage used" value={0} max={100} />);
		const fill = container.querySelector('[role="meter"] > div');

		expect(fill?.className).not.toContain('min-w-[2px]');
	});

	test('renders its hint', () => {
		render(<Meter label="Storage used" value={3} max={100} hint="557 KB / 16.0 GB" />);

		expect(screen.getByText('557 KB / 16.0 GB')).toBeDefined();
	});
});
