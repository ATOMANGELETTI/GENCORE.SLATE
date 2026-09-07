import { describe, expect, test } from 'bun:test';

import { COMMANDS, EVENTS, isSlateError } from '../src/index.ts';

/**
 * The IPC contract is hand-authored rather than generated (ADR 0008), so these
 * tests are part of the mitigation for that choice. They cannot detect a drift
 * from the Rust side on their own — the matching Rust test does that — but they
 * do pin the shape the frontend depends on.
 */

describe('isSlateError', () => {
	test('recognises an error from the backend', () => {
		expect(isSlateError({ kind: 'paths', message: 'nope' })).toBe(true);
	});

	test('rejects anything that is not one', () => {
		expect(isSlateError(null)).toBe(false);
		expect(isSlateError(undefined)).toBe(false);
		expect(isSlateError('paths')).toBe(false);
		expect(isSlateError(new Error('boom'))).toBe(false);
		expect(isSlateError({ kind: 'paths' })).toBe(false);
		expect(isSlateError({ kind: 'paths', message: 42 })).toBe(false);
	});
});

describe('command surface', () => {
	test('names are unique', () => {
		expect(new Set(COMMANDS).size).toBe(COMMANDS.length);
	});

	test('every command is snake_case and prefixed, matching the Rust side', () => {
		for (const command of COMMANDS) {
			expect(command).toMatch(/^slate_[a-z0-9_]+$/);
		}
	});

	test('the window chrome commands the title bar needs are all present', () => {
		// A missing one produces a title bar whose buttons do nothing — easy to
		// ship, embarrassing to discover.
		for (const required of [
			'slate_window_state',
			'slate_window_minimize',
			'slate_window_toggle_maximize',
			'slate_window_close',
		] as const) {
			expect(COMMANDS).toContain(required);
		}
	});
});

describe('events', () => {
	test('every event name is namespaced', () => {
		for (const name of Object.values(EVENTS)) {
			expect(name).toMatch(/^slate:\/\//);
		}
	});

	test('names are unique', () => {
		const names = Object.values(EVENTS);
		expect(new Set(names).size).toBe(names.length);
	});
});
