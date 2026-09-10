import { beforeEach, describe, expect, test } from 'bun:test';

import { barMode, useLauncherStore } from '../../../src/state/launcher.store.ts';

const INITIAL = useLauncherStore.getState();

beforeEach(() => {
	// Zustand stores are module singletons, so a test that left the query set
	// would change what the next one sees.
	useLauncherStore.setState(INITIAL, true);
});

const store = () => useLauncherStore.getState();

describe('barMode', () => {
	test('a leading slash means a command', () => {
		expect(barMode('/run')).toBe('command');
	});

	test('anything else is a search', () => {
		expect(barMode('terminal')).toBe('search');
		expect(barMode('')).toBe('search');
	});
});

describe('views', () => {
	test('opens and closes', () => {
		store().openView('settings');
		expect(store().activeView).toBe('settings');

		store().closeView();
		expect(store().activeView).toBeNull();
	});

	test('toggling the open view closes it', () => {
		store().openView('settings');
		store().toggleView('settings');

		expect(store().activeView).toBeNull();
	});

	test('toggling a different view switches to it rather than closing', () => {
		store().openView('settings');
		store().toggleView('about');

		expect(store().activeView).toBe('about');
	});
});

describe('the query', () => {
	test('changing it resets the highlight to the top', () => {
		// The row that was highlighted is very unlikely to still be at that
		// index, and resetting is what makes Enter always mean "best match".
		store().selectIndex(4);
		store().setQuery('term');

		expect(store().selectedIndex).toBe(0);
	});

	test('clearing empties it and resets the highlight', () => {
		store().setQuery('term');
		store().selectIndex(3);
		store().clearQuery();

		expect(store().query).toBe('');
		expect(store().selectedIndex).toBe(0);
	});
});

describe('moveSelection', () => {
	test('moves down', () => {
		store().moveSelection(1, 5);

		expect(store().selectedIndex).toBe(1);
	});

	test('wraps past the end', () => {
		store().selectIndex(4);
		store().moveSelection(1, 5);

		expect(store().selectedIndex).toBe(0);
	});

	test('wraps backwards past the start', () => {
		// A plain modulo gives -1 here, which selects nothing.
		store().moveSelection(-1, 5);

		expect(store().selectedIndex).toBe(4);
	});

	test('collapses to the top when there is nothing to select', () => {
		store().selectIndex(3);
		store().moveSelection(1, 0);

		expect(store().selectedIndex).toBe(0);
	});
});

describe('pinning', () => {
	test('pins and unpins through one action', () => {
		store().togglePin('code');
		expect(store().pinnedIds).toEqual(['code']);

		store().togglePin('code');
		expect(store().pinnedIds).toEqual([]);
	});

	test('keeps the order things were pinned in', () => {
		store().togglePin('code');
		store().togglePin('calculator');

		expect(store().pinnedIds).toEqual(['code', 'calculator']);
	});

	test('unpinning one leaves the others in order', () => {
		store().togglePin('a');
		store().togglePin('b');
		store().togglePin('c');
		store().togglePin('b');

		expect(store().pinnedIds).toEqual(['a', 'c']);
	});
});

describe('appearance', () => {
	test('starts on the documented defaults', () => {
		expect(store().density).toBe('comfortable');
		expect(store().accent).toBe('cyan');
	});

	test('records a density choice', () => {
		store().setDensity('compact');

		expect(store().density).toBe('compact');
	});

	test('records an accent choice', () => {
		store().setAccent('teal');

		expect(store().accent).toBe('teal');
	});
});
