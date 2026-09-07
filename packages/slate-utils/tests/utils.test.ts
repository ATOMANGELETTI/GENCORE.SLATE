import { describe, expect, test } from 'bun:test';

import { clamp, debounce, formatBytes, formatDuration } from '../src/index.ts';

describe('formatBytes', () => {
	test('uses base-10 units, as a file manager should', () => {
		// Windows Explorer reports base 2 and calls it KB; base 10 with correct
		// unit names is the honest reading and matches what drives advertise.
		expect(formatBytes(0)).toBe('0 B');
		expect(formatBytes(999)).toBe('999 B');
		expect(formatBytes(1000)).toBe('1.0 kB');
		expect(formatBytes(1_500_000)).toBe('1.5 MB');
	});

	test('drops the decimal once the number is large enough not to need it', () => {
		expect(formatBytes(9_900)).toBe('9.9 kB');
		expect(formatBytes(15_000)).toBe('15 kB');
	});

	test('does not run out of units', () => {
		expect(formatBytes(2.5e15)).toBe('2.5 PB');
	});

	test('reports nonsense as unknown rather than inventing a number', () => {
		expect(formatBytes(-1)).toBe('—');
		expect(formatBytes(Number.NaN)).toBe('—');
		expect(formatBytes(Number.POSITIVE_INFINITY)).toBe('—');
	});
});

describe('clamp', () => {
	test('constrains to the range', () => {
		expect(clamp(5, 0, 10)).toBe(5);
		expect(clamp(-5, 0, 10)).toBe(0);
		expect(clamp(50, 0, 10)).toBe(10);
	});

	test('returns the minimum when the bounds are inverted', () => {
		// Better than silently producing a value outside both bounds.
		expect(clamp(5, 10, 0)).toBe(10);
	});
});

describe('formatDuration', () => {
	test('changes unit as the magnitude grows', () => {
		expect(formatDuration(250)).toBe('250 ms');
		expect(formatDuration(1_500)).toBe('1.5 s');
		expect(formatDuration(90_000)).toBe('1m 30s');
	});

	test('reports nonsense as unknown', () => {
		expect(formatDuration(-1)).toBe('—');
		expect(formatDuration(Number.NaN)).toBe('—');
	});
});

describe('debounce', () => {
	test('runs once with the last arguments after the quiet period', async () => {
		const seen: number[] = [];
		const record = debounce((value: number) => seen.push(value), 10);

		record(1);
		record(2);
		record(3);
		expect(seen).toEqual([]);

		await Bun.sleep(30);
		expect(seen).toEqual([3]);
	});

	test('can be cancelled before it fires', async () => {
		const seen: number[] = [];
		const record = debounce((value: number) => seen.push(value), 10);

		record(1);
		record.cancel();

		await Bun.sleep(30);
		expect(seen).toEqual([]);
	});
});
