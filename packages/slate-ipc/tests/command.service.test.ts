import { describe, expect, test } from 'bun:test';

import { isDesktop, toSlateError } from '../src/index.ts';

/**
 * `toSlateError` is the reason application code can `catch` from an IPC call
 * and know what it has. Rust's `Err` arrives through Tauri as an arbitrary
 * rejected value, so without normalisation every call site would need its own
 * guesswork.
 */
describe('toSlateError', () => {
	test('passes a real backend error through unchanged', () => {
		const original = { kind: 'notFound' as const, message: 'no such app' };

		expect(toSlateError(original)).toBe(original);
	});

	test('wraps an Error and names the command that produced it', () => {
		const result = toSlateError(new Error('the pipe closed'), 'slate_window_state');

		expect(result.kind).toBe('internal');
		expect(result.message).toContain('the pipe closed');
		expect(result.message).toContain('slate_window_state');
	});

	test('survives being handed something that is not an error at all', () => {
		// Tauri rejects with whatever the command produced; a string is common.
		expect(toSlateError('boom').kind).toBe('internal');
		expect(toSlateError('boom').message).toContain('boom');
		expect(toSlateError(undefined).message).toContain('undefined');
		expect(toSlateError({ unexpected: true }).kind).toBe('internal');
	});

	test('omits the command suffix when none was given', () => {
		expect(toSlateError(new Error('bare')).message).toBe('bare');
	});
});

describe('isDesktop', () => {
	test('reports false outside a Tauri webview', () => {
		// This is what lets the UI kit gallery render the same components in an
		// ordinary browser instead of throwing.
		expect(isDesktop()).toBe(false);
	});
});
