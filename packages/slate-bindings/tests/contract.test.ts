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

/**
 * The cross-language half of ADR 0008's mitigation.
 *
 * A command name exists in three places: `shared_command_names()` in
 * `slate-runtime`, `COMMANDS` here, and every application's `invoke_handler!`.
 * A drift between any two of them fails at runtime with an `undefined` rather
 * than at compile time — the hardest bug in this codebase to track down — and
 * the symptom is a menu item that silently does nothing.
 *
 * These read the Rust sources directly. That is unusual for a test and is the
 * point: nothing else can see across the language boundary, and hand-authored
 * bindings were only ever acceptable because something checked them.
 */
describe('the Rust side agrees', () => {
	const REPO_ROOT = new URL('../../../', import.meta.url);

	async function readSource(path: string): Promise<string> {
		return await Bun.file(new URL(path, REPO_ROOT)).text();
	}

	/**
	 * Pulls the command names out of the region between two markers.
	 *
	 * Anchored on an explicit opening marker rather than on the first bracket:
	 * `shared_command_names`'s own return type is `&'static [&'static str]`, so
	 * the first `]` in the function closes the type, not the list.
	 */
	function slateNames(source: string, opening: string, closing: string): string[] {
		const start = source.indexOf(opening);
		expect(start).toBeGreaterThan(-1);

		const body = source.slice(start + opening.length);
		const end = body.indexOf(closing);
		expect(end).toBeGreaterThan(-1);

		return [...body.slice(0, end).matchAll(/slate_[a-z0-9_]+/g)].map((match) => match[0]);
	}

	test('shared_command_names() lists exactly the commands in COMMANDS', async () => {
		const source = await readSource('crates/slate-runtime/src/lib.rs');
		const rust = slateNames(source, "-> &'static [&'static str] {", ']');

		expect(rust.length).toBeGreaterThan(0);
		expect([...rust].sort()).toEqual([...COMMANDS].sort());
	});

	test.each(['slate-launcher', 'slate-terminal', 'slate-explorer'])(
		'%s registers every shared command',
		async (app) => {
			const source = await readSource(`tauri/${app}/src-tauri/src/lib.rs`);
			const registered = new Set(slateNames(source, 'tauri::generate_handler![', ']'));

			// A command in the contract that no application registers is a
			// frontend call that will reject at runtime.
			for (const command of COMMANDS) {
				expect(registered).toContain(command);
			}
		},
	);
});
