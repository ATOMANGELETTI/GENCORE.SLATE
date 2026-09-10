import { describe, expect, test } from 'bun:test';
import type { ViewId } from '../../../src/views/view.types.ts';
import { RAIL_VIEWS, VIEWS } from '../../../src/views/views.registry.ts';

/**
 * The registry is read by three places — the rail's buttons, the view menu, and
 * the title bar. These pin the properties those three rely on, so that a view
 * added later cannot half-exist.
 */
describe('VIEWS', () => {
	test('every view has a title, an icon and at least one section', () => {
		for (const [id, view] of Object.entries(VIEWS)) {
			expect(view.id).toBe(id as ViewId);
			expect(view.title.length).toBeGreaterThan(0);
			expect(view.tooltip.length).toBeGreaterThan(0);
			expect(view.icon).toBeDefined();
			// A view with no sections would render an empty menu column, which
			// is a layout that shifts depending on which view is open.
			expect(view.sections.length).toBeGreaterThan(0);
		}
	});

	test('section ids are unique within a view', () => {
		for (const view of Object.values(VIEWS)) {
			const ids = view.sections.map((section) => section.id);

			expect(new Set(ids).size).toBe(ids.length);
		}
	});
});

describe('RAIL_VIEWS', () => {
	test('is exactly the views marked for the rail', () => {
		const expected = Object.values(VIEWS).filter((view) => view.isInRail);

		expect(RAIL_VIEWS).toEqual(expected);
	});

	test('holds five, which is what fits across the rail', () => {
		expect(RAIL_VIEWS).toHaveLength(5);
	});

	test('leaves out the views reached by command or by key', () => {
		const railIds = RAIL_VIEWS.map((view) => view.id);

		expect(railIds).not.toContain('help');
		expect(railIds).not.toContain('updates');
	});
});
