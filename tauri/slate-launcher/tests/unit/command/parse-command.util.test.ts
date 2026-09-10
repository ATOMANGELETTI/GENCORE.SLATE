import { describe, expect, test } from 'bun:test';

import { isCommand, parseCommand, tokenize } from '../../../src/command/parse-command.util.ts';

/**
 * The parser runs on every keystroke, so most of these are half-written input.
 * A parser that only handled finished commands would be correct for the one
 * moment the user stops typing and wrong for every moment before it.
 */
describe('isCommand', () => {
	test('a leading slash means a command', () => {
		expect(isCommand('/run')).toBe(true);
	});

	test('anything else is a search', () => {
		expect(isCommand('terminal')).toBe(false);
		expect(isCommand('')).toBe(false);
		expect(isCommand(' /run')).toBe(false);
	});
});

describe('tokenize', () => {
	test('splits on whitespace', () => {
		expect(tokenize('run --terminal')).toEqual(['run', '--terminal']);
	});

	test('collapses runs of whitespace', () => {
		expect(tokenize('run    --terminal')).toEqual(['run', '--terminal']);
	});

	test('keeps a quoted run together', () => {
		expect(tokenize('find "annual report"')).toEqual(['find', 'annual report']);
	});

	test('accepts single quotes too', () => {
		expect(tokenize("find 'annual report'")).toEqual(['find', 'annual report']);
	});

	test('runs an unclosed quote to the end rather than failing', () => {
		// The user is still typing it.
		expect(tokenize('find "annual rep')).toEqual(['find', 'annual rep']);
	});

	test('returns nothing for an empty string', () => {
		expect(tokenize('')).toEqual([]);
	});
});

describe('parseCommand', () => {
	test('reads the command name', () => {
		expect(parseCommand('/run').name).toBe('run');
	});

	test('reads a switch flag', () => {
		expect(parseCommand('/run --terminal').flags).toEqual({ terminal: true });
	});

	test('reads a flag with a value', () => {
		expect(parseCommand('/config --theme dark').flags).toEqual({ theme: 'dark' });
	});

	test('does not take the next flag as a value', () => {
		// In "--terminal --force", terminal is a switch, not a flag whose value
		// happens to be another flag.
		expect(parseCommand('/run --terminal --force').flags).toEqual({
			terminal: true,
			force: true,
		});
	});

	test('collects bare words as positional arguments', () => {
		expect(parseCommand('/find invoice 2024').positional).toEqual(['invoice', '2024']);
	});

	describe('while the user is still typing', () => {
		test('a lone slash names nothing', () => {
			const parsed = parseCommand('/');

			expect(parsed.name).toBe('');
			expect(parsed.currentToken).toBe('');
		});

		test('a partial name is both the name and the current token', () => {
			const parsed = parseCommand('/con');

			expect(parsed.name).toBe('con');
			expect(parsed.currentToken).toBe('con');
			expect(parsed.isAtNewToken).toBe(false);
		});

		test('a trailing space starts a new, empty token', () => {
			// This is what tells the predictor to offer flags rather than to go
			// on suggesting the command whose name is already complete.
			const parsed = parseCommand('/config ');

			expect(parsed.name).toBe('config');
			expect(parsed.currentToken).toBe('');
			expect(parsed.isAtNewToken).toBe(true);
		});

		test('a half-typed flag is the current token', () => {
			const parsed = parseCommand('/config --th');

			expect(parsed.currentToken).toBe('--th');
			expect(parsed.isAtNewToken).toBe(false);
		});

		test('a flag awaiting its value is a switch until one arrives', () => {
			const parsed = parseCommand('/config --theme ');

			expect(parsed.flags).toEqual({ theme: true });
			expect(parsed.isAtNewToken).toBe(true);
		});
	});

	test('never throws on rubbish', () => {
		for (const input of ['/', '//', '/ --', '/--', '/run --', '/""', '/  ']) {
			expect(() => parseCommand(input)).not.toThrow();
		}
	});
});
