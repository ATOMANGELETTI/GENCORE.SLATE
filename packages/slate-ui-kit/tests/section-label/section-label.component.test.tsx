import { describe, expect, test } from 'bun:test';
import { render, screen } from '@slate/testing';

import { SectionLabel } from '../../src/section-label/section-label.component.tsx';

describe('SectionLabel', () => {
	test('renders its text', () => {
		render(<SectionLabel>Suite</SectionLabel>);

		expect(screen.getByText('Suite')).toBeDefined();
	});

	test('is not a heading', () => {
		// These label groups inside a list. Announcing "heading level 3" between
		// every two rows is noise rather than structure — the group names itself
		// through aria-labelledby instead.
		render(<SectionLabel>Suite</SectionLabel>);

		expect(screen.queryByRole('heading')).toBeNull();
	});

	test('can name the region it labels', () => {
		// This is the whole reason it is not a heading: the group borrows the
		// label's text as its accessible name, without a heading appearing
		// between every two rows of a list.
		render(
			<>
				<SectionLabel id="suite-label">Suite</SectionLabel>
				<nav aria-labelledby="suite-label" />
			</>,
		);

		expect(screen.getByRole('navigation', { name: 'Suite' })).toBeDefined();
	});

	test('merges a caller className rather than dropping it', () => {
		render(<SectionLabel className="pt-0">Suite</SectionLabel>);

		expect(screen.getByText('Suite').className).toContain('pt-0');
	});
});
