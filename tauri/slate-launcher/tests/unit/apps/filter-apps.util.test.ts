import { describe, expect, test } from 'bun:test';

import type { LauncherApp } from '../../../src/apps/app.types.ts';
import {
	countRunning,
	countUpdates,
	filterApps,
	flattenSections,
	groupApps,
} from '../../../src/apps/filter-apps.util.ts';

function app(overrides: Partial<LauncherApp> & { id: string; name: string }): LauncherApp {
	return {
		source: 'portapps.io',
		version: '1.0.0',
		icon: 'package',
		state: 'ready',
		...overrides,
	};
}

const APPS: LauncherApp[] = [
	app({ id: 'slate-terminal', name: 'Terminal', source: 'gencore', state: 'running' }),
	app({ id: 'slate-explorer', name: 'Explorer', source: 'gencore' }),
	app({ id: 'downloader', name: 'Downloader', state: 'update' }),
	app({ id: 'code', name: 'Code' }),
	app({ id: 'calculator', name: 'Calculator', source: 'portableapps.com' }),
];

describe('filterApps', () => {
	test('an empty query keeps everything, in its original order', () => {
		expect(filterApps(APPS, '')).toEqual(APPS);
	});

	test('whitespace alone is still an empty query', () => {
		expect(filterApps(APPS, '   ')).toEqual(APPS);
	});

	test('matches on a prefix', () => {
		expect(filterApps(APPS, 'down').map((found) => found.name)).toEqual(['Downloader']);
	});

	test('matches an abbreviation, not just a prefix', () => {
		// This is the whole point of fuzzy matching in a launcher.
		expect(filterApps(APPS, 'dwn').map((found) => found.name)).toEqual(['Downloader']);
	});

	test('ignores case', () => {
		expect(filterApps(APPS, 'TERM').map((found) => found.name)).toEqual(['Terminal']);
	});

	test('ranks a word-start match above a mid-word one', () => {
		const found = filterApps(APPS, 'cal').map((entry) => entry.name);

		expect(found[0]).toBe('Calculator');
	});

	test('returns nothing when nothing matches', () => {
		expect(filterApps(APPS, 'zzzz')).toEqual([]);
	});
});

describe('groupApps', () => {
	test('separates the suite from portable applications', () => {
		const sections = groupApps(APPS, []);

		expect(sections.map((section) => section.group)).toEqual(['suite', 'portable']);
	});

	test('drops a section with nothing in it rather than showing an empty heading', () => {
		const sections = groupApps(APPS, []);

		expect(sections.some((section) => section.group === 'pinned')).toBe(false);
	});

	test('lists pinned applications first', () => {
		const sections = groupApps(APPS, ['code']);

		expect(sections[0]?.group).toBe('pinned');
		expect(sections[0]?.apps.map((entry) => entry.id)).toEqual(['code']);
	});

	test('a pinned application appears only once', () => {
		// Showing it under both Pinned and its own source would make the list
		// longer for having been organised.
		const sections = groupApps(APPS, ['slate-terminal']);
		const ids = flattenSections(sections).map((entry) => entry.id);

		expect(ids.filter((id) => id === 'slate-terminal')).toHaveLength(1);
	});

	test('keeps pinned applications in the order they were pinned', () => {
		// That order is the only thing the user said about them, so sorting it
		// alphabetically would discard the section's only information.
		const sections = groupApps(APPS, ['code', 'calculator']);

		expect(sections[0]?.apps.map((entry) => entry.id)).toEqual(['code', 'calculator']);
	});

	test('pinning something that is not there changes nothing', () => {
		expect(groupApps(APPS, ['nonexistent'])).toEqual(groupApps(APPS, []));
	});

	test('an empty list produces no sections at all', () => {
		expect(groupApps([], [])).toEqual([]);
	});
});

describe('flattenSections', () => {
	test('returns every application in the order it is rendered', () => {
		const flat = flattenSections(groupApps(APPS, ['code']));

		expect(flat).toHaveLength(APPS.length);
		expect(flat[0]?.id).toBe('code');
	});
});

describe('counts', () => {
	test('counts applications with an update waiting', () => {
		expect(countUpdates(APPS)).toBe(1);
	});

	test('counts running applications', () => {
		expect(countRunning(APPS)).toBe(1);
	});

	test('counts nothing in an empty list', () => {
		expect(countUpdates([])).toBe(0);
		expect(countRunning([])).toBe(0);
	});
});
