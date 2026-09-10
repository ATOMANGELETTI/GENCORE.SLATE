import type { ParsedCommand } from './command.types.ts';

/**
 * Takes apart what the user has typed into the command bar.
 *
 * This runs on **every keystroke**, on input that is nearly always incomplete,
 * so it is written to be tolerant rather than strict. `/`, `/con`, `/config --`
 * and `/config --theme ` are all things a user is in the middle of typing, and
 * each has to produce something the hint strip and the predictor can use. It
 * never throws and it never reports an error: an unrecognised command is simply
 * one that matches no spec, which the predictor already handles by finding
 * nothing.
 *
 * The parser knows nothing about which commands exist. Validation is the
 * predictor's job — keeping them apart is what lets this be tested against
 * strings alone.
 */

/**
 * Splits on whitespace, keeping quoted runs together.
 *
 * `/find "annual report"` is one argument, not two. Both quote characters are
 * accepted because a user typing a path is as likely to reach for one as the
 * other, and an unclosed quote runs to the end of the input rather than
 * failing — the user is still typing it.
 */
export function tokenize(input: string): string[] {
	const tokens: string[] = [];
	let current = '';
	let quote: '"' | "'" | null = null;

	for (const character of input) {
		if (quote) {
			if (character === quote) {
				quote = null;
			} else {
				current += character;
			}
			continue;
		}

		if (character === '"' || character === "'") {
			quote = character;
			continue;
		}

		if (character === ' ' || character === '\t') {
			if (current.length > 0) {
				tokens.push(current);
				current = '';
			}
			continue;
		}

		current += character;
	}

	if (current.length > 0) {
		tokens.push(current);
	}

	return tokens;
}

/** Whether the input is a command rather than a search. */
export function isCommand(input: string): boolean {
	return input.startsWith('/');
}

/**
 * Parses a command line.
 *
 * A flag takes the next token as its value only when that token is not itself a
 * flag: in `/run --terminal --force`, `--terminal` is a switch rather than a
 * flag whose value is `--force`. Whether a flag *should* take a value is in the
 * spec, and the predictor is what consults it; here the shape of the input is
 * enough to decide.
 */
export function parseCommand(input: string): ParsedCommand {
	const body = isCommand(input) ? input.slice(1) : input;
	const tokens = tokenize(body);
	const isAtNewToken = body.length > 0 && /\s$/.test(body);

	const [name = '', ...rest] = tokens;
	const flags: Record<string, string | true> = {};
	const positional: string[] = [];

	for (let index = 0; index < rest.length; index++) {
		const token = rest[index];
		if (token === undefined) {
			continue;
		}

		if (!token.startsWith('--')) {
			positional.push(token);
			continue;
		}

		const flag = token.slice(2);
		const next = rest[index + 1];

		if (next !== undefined && !next.startsWith('--')) {
			flags[flag] = next;
			index += 1;
		} else {
			flags[flag] = true;
		}
	}

	// The token completion acts on. An input ending in a space has finished
	// its last token, so the current one is empty and a new token is starting.
	const currentToken = isAtNewToken ? '' : (tokens.at(-1) ?? '');

	return { name, flags, positional, currentToken, isAtNewToken };
}
