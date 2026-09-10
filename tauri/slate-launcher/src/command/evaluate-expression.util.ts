/**
 * Arithmetic and unit conversion, typed straight into the command bar.
 *
 * `1920*0.75` answers 1440. `4gb in mb` answers 4000 MB. This is the trick that
 * makes a launcher worth summoning rather than worth opening.
 *
 * # Why this is hand-written
 *
 * **Never `eval`, and never `new Function`.** The content security policy in
 * every `tauri.conf.json` forbids both, so they would fail in the real window
 * while working perfectly in the gallery — but the policy is downstream of the
 * actual reason, which is that handing user input to a JavaScript evaluator
 * inside a desktop application is a remote code execution bug waiting for
 * someone to paste the wrong thing.
 *
 * A recursive-descent parser over a five-operator grammar is about a hundred
 * lines and cannot execute anything. It also gives honest failure: an input
 * that is not an expression returns `null` rather than throwing, so the bar
 * simply shows no answer instead of an error for every half-typed sum.
 *
 * # The grammar
 *
 * ```
 * expression := term (('+' | '-') term)*
 * term       := power (('*' | '/' | '%') power)*
 * power      := unary ('^' power)?        // right-associative
 * unary      := ('-' | '+')? primary
 * primary    := number unit? | '(' expression ')'
 * ```
 */

/** A successful evaluation. */
export type Evaluation = {
	/** The numeric result, unrounded. */
	value: number;
	/** The result formatted for display, with a unit where there is one. */
	text: string;
};

/**
 * Byte units, in bytes.
 *
 * Both decimal and binary, because a user asking "how big is this really" means
 * one of them and will say which. Decimal matches `formatBytes` in
 * `@slate/utils`, which is what the rest of the suite displays.
 */
const UNITS: Record<string, number> = {
	b: 1,
	kb: 1e3,
	mb: 1e6,
	gb: 1e9,
	tb: 1e12,
	kib: 1024,
	mib: 1024 ** 2,
	gib: 1024 ** 3,
	tib: 1024 ** 4,
};

type Token =
	| { kind: 'number'; value: number }
	| { kind: 'unit'; value: string }
	| { kind: 'op'; value: string };

const NUMBER_PATTERN = /^\d*\.?\d+(?:[eE][+-]?\d+)?/;
const WORD_PATTERN = /^[a-zA-Z]+/;
const OPERATORS = '+-*/%^()';

/** Reads one token at `index`, or `null` if nothing there is a token. */
function readToken(input: string, index: number): { token: Token; length: number } | null {
	const rest = input.slice(index);
	const character = rest[0];
	if (character === undefined) {
		return null;
	}

	if (/[0-9.]/.test(character)) {
		const match = NUMBER_PATTERN.exec(rest);
		return match
			? { token: { kind: 'number', value: Number.parseFloat(match[0]) }, length: match[0].length }
			: null;
	}

	if (/[a-zA-Z]/.test(character)) {
		const match = WORD_PATTERN.exec(rest);
		return match
			? { token: { kind: 'unit', value: match[0].toLowerCase() }, length: match[0].length }
			: null;
	}

	if (OPERATORS.includes(character)) {
		return { token: { kind: 'op', value: character }, length: 1 };
	}

	return null;
}

/**
 * Splits an expression into numbers, units and operators.
 *
 * Returns `null` on any character the grammar has no meaning for, which is what
 * stops a search for "wifi password" being taken as a sum.
 */
function tokenize(input: string): Token[] | null {
	const tokens: Token[] = [];
	let index = 0;

	while (index < input.length) {
		if (/\s/.test(input[index] ?? '')) {
			index += 1;
			continue;
		}

		const read = readToken(input, index);
		if (!read) {
			return null;
		}

		tokens.push(read.token);
		index += read.length;
	}

	return tokens;
}

/** A cursor over the token list, so the grammar functions can stay small. */
class Reader {
	private position = 0;

	constructor(private readonly tokens: Token[]) {}

	peek(): Token | undefined {
		return this.tokens[this.position];
	}

	next(): Token | undefined {
		const token = this.tokens[this.position];
		this.position += 1;
		return token;
	}

	/** Consumes an operator if it is one of `values`. */
	takeOp(values: string[]): string | null {
		const token = this.peek();
		if (token?.kind === 'op' && values.includes(token.value)) {
			this.position += 1;
			return token.value;
		}
		return null;
	}

	get isDone(): boolean {
		return this.position >= this.tokens.length;
	}
}

function parsePrimary(reader: Reader): number | null {
	if (reader.takeOp(['('])) {
		const value = parseExpression(reader);
		if (value === null || !reader.takeOp([')'])) {
			return null;
		}
		return value;
	}

	const token = reader.next();
	if (token?.kind !== 'number') {
		return null;
	}

	// A unit immediately after a number scales it: `4gb` is 4e9.
	const following = reader.peek();
	if (following?.kind === 'unit') {
		const factor = UNITS[following.value];
		if (factor !== undefined) {
			reader.next();
			return token.value * factor;
		}
	}

	return token.value;
}

function parseUnary(reader: Reader): number | null {
	const sign = reader.takeOp(['-', '+']);
	const value = parsePrimary(reader);
	if (value === null) {
		return null;
	}
	return sign === '-' ? -value : value;
}

function parsePower(reader: Reader): number | null {
	const base = parseUnary(reader);
	if (base === null) {
		return null;
	}
	if (!reader.takeOp(['^'])) {
		return base;
	}
	// Right-associative, so 2^3^2 is 512 rather than 64.
	const exponent = parsePower(reader);
	return exponent === null ? null : base ** exponent;
}

function parseTerm(reader: Reader): number | null {
	let left = parsePower(reader);
	if (left === null) {
		return null;
	}

	for (;;) {
		const operator = reader.takeOp(['*', '/', '%']);
		if (!operator) {
			return left;
		}

		const right = parsePower(reader);
		if (right === null) {
			return null;
		}
		// Division by zero yields Infinity in JavaScript rather than throwing.
		// Rejected here, because "4/0 = Infinity" is not an answer anyone typed
		// a sum to receive.
		if ((operator === '/' || operator === '%') && right === 0) {
			return null;
		}

		left = operator === '*' ? left * right : operator === '/' ? left / right : left % right;
	}
}

function parseExpression(reader: Reader): number | null {
	let left = parseTerm(reader);
	if (left === null) {
		return null;
	}

	for (;;) {
		const operator = reader.takeOp(['+', '-']);
		if (!operator) {
			return left;
		}

		const right = parseTerm(reader);
		if (right === null) {
			return null;
		}
		left = operator === '+' ? left + right : left - right;
	}
}

/** Rounds for display without turning 1440 into "1440.00". */
function formatNumber(value: number): string {
	if (Number.isInteger(value)) {
		return value.toLocaleString('en-GB');
	}
	// Six significant decimals is well past what a launcher is asked for, and
	// trimming the zeros is what keeps 0.1 + 0.2 from displaying its floating
	// point tail.
	return Number.parseFloat(value.toFixed(6)).toLocaleString('en-GB', {
		maximumFractionDigits: 6,
	});
}

/**
 * Evaluates an expression, optionally converting the result to a unit.
 *
 * The conversion form is `<expression> in <unit>` or `<expression> to <unit>`.
 * Returns `null` for anything that is not an expression, which is most of what
 * a user types — the bar asks this of every keystroke and shows an answer only
 * when there is one.
 */
export function evaluateExpression(input: string): Evaluation | null {
	const trimmed = input.trim();
	if (trimmed.length === 0) {
		return null;
	}

	// A bare number is not a calculation. Answering "5" with "5" is noise at
	// the top of a result list the user is trying to read.
	if (/^-?\d*\.?\d+$/.test(trimmed)) {
		return null;
	}

	const conversion = /\s+(?:in|to)\s+([a-zA-Z]+)$/.exec(trimmed);
	const body = conversion ? trimmed.slice(0, conversion.index) : trimmed;
	const targetUnit = conversion?.[1]?.toLowerCase();

	if (targetUnit !== undefined && UNITS[targetUnit] === undefined) {
		return null;
	}

	const tokens = tokenize(body);
	if (!tokens || tokens.length === 0) {
		return null;
	}

	const reader = new Reader(tokens);
	const value = parseExpression(reader);

	// Trailing tokens mean the input was only partly an expression — `2 + 3 x`
	// is not four plus something, it is not an expression at all.
	if (value === null || !reader.isDone || !Number.isFinite(value)) {
		return null;
	}

	if (targetUnit !== undefined) {
		const factor = UNITS[targetUnit];
		if (factor === undefined) {
			return null;
		}
		const converted = value / factor;
		return { value: converted, text: `${formatNumber(converted)} ${targetUnit.toUpperCase()}` };
	}

	return { value, text: formatNumber(value) };
}
