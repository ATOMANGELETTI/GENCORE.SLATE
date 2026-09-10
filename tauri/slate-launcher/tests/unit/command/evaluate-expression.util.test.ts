import { describe, expect, test } from 'bun:test';

import { evaluateExpression } from '../../../src/command/evaluate-expression.util.ts';

/**
 * The one piece of real logic in the Launcher, so it gets the most tests.
 *
 * Half of these are about what it must *refuse*. The command bar asks this of
 * every keystroke, on text that is almost always not a sum, and a parser that
 * answered "0" for "wifi password" would put a wrong answer at the top of every
 * search.
 */
describe('evaluateExpression', () => {
	describe('arithmetic', () => {
		test('multiplies', () => {
			expect(evaluateExpression('1920*0.75')?.value).toBe(1440);
		});

		test('respects operator precedence', () => {
			expect(evaluateExpression('2+3*4')?.value).toBe(14);
		});

		test('respects parentheses over precedence', () => {
			expect(evaluateExpression('(2+3)*4')?.value).toBe(20);
		});

		test('handles unary minus', () => {
			expect(evaluateExpression('-5+3')?.value).toBe(-2);
		});

		test('subtracts left to right', () => {
			expect(evaluateExpression('10-3-2')?.value).toBe(5);
		});

		test('divides', () => {
			expect(evaluateExpression('144/12')?.value).toBe(12);
		});

		test('takes a modulus', () => {
			expect(evaluateExpression('17%5')?.value).toBe(2);
		});

		test('exponentiates right-associatively', () => {
			// 2^(3^2) = 512, not (2^3)^2 = 64.
			expect(evaluateExpression('2^3^2')?.value).toBe(512);
		});

		test('ignores whitespace', () => {
			expect(evaluateExpression('  12  *  2  ')?.value).toBe(24);
		});

		test('reads scientific notation', () => {
			expect(evaluateExpression('1e3+1')?.value).toBe(1001);
		});
	});

	describe('units', () => {
		test('converts decimal byte units', () => {
			expect(evaluateExpression('4gb in mb')?.text).toBe('4,000 MB');
		});

		test('converts binary byte units', () => {
			expect(evaluateExpression('1gib in mib')?.text).toBe('1,024 MIB');
		});

		test('accepts "to" as well as "in"', () => {
			expect(evaluateExpression('2gb to mb')?.text).toBe('2,000 MB');
		});

		test('scales a unit inside a larger sum', () => {
			expect(evaluateExpression('2gb + 500mb in mb')?.text).toBe('2,500 MB');
		});

		test('refuses a unit it does not know', () => {
			expect(evaluateExpression('4gb in furlongs')).toBeNull();
		});
	});

	describe('formatting', () => {
		test('does not print a decimal tail on a whole number', () => {
			expect(evaluateExpression('2*3')?.text).toBe('6');
		});

		test('trims floating point noise', () => {
			// 0.1 + 0.2 is 0.30000000000000004 in IEEE 754.
			expect(evaluateExpression('0.1+0.2')?.text).toBe('0.3');
		});

		test('groups thousands', () => {
			expect(evaluateExpression('1000*1000')?.text).toBe('1,000,000');
		});
	});

	describe('what it refuses', () => {
		test('ordinary words', () => {
			expect(evaluateExpression('wifi password')).toBeNull();
		});

		test('an empty string', () => {
			expect(evaluateExpression('')).toBeNull();
		});

		test('a bare number, which is not a calculation', () => {
			// Answering "5" with "5" is noise at the top of a result list.
			expect(evaluateExpression('5')).toBeNull();
			expect(evaluateExpression('42.5')).toBeNull();
		});

		test('a half-typed sum', () => {
			expect(evaluateExpression('2+')).toBeNull();
			expect(evaluateExpression('*3')).toBeNull();
		});

		test('unbalanced parentheses', () => {
			expect(evaluateExpression('(2+3')).toBeNull();
			expect(evaluateExpression('))')).toBeNull();
		});

		test('trailing rubbish after a valid expression', () => {
			// "2 + 3 x" is not four plus something; it is not an expression.
			expect(evaluateExpression('2+3 x')).toBeNull();
		});

		test('division by zero, rather than answering Infinity', () => {
			expect(evaluateExpression('4/0')).toBeNull();
			expect(evaluateExpression('4%0')).toBeNull();
		});

		test('a stray symbol the grammar has no meaning for', () => {
			expect(evaluateExpression('2 & 3')).toBeNull();
			expect(evaluateExpression('alert(1)')).toBeNull();
		});
	});
});
