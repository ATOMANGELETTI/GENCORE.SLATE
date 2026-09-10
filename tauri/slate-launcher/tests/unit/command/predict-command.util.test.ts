import { describe, expect, test } from 'bun:test';

import { COMMAND_SPECS } from '../../../src/command/commands.registry.ts';
import { parseCommand } from '../../../src/command/parse-command.util.ts';
import {
	type Frecency,
	frecencyBonus,
	ghostCompletion,
	predictCommands,
	recordRun,
} from '../../../src/command/predict-command.util.ts';

const NOW = Date.UTC(2026, 8, 9);
const DAY = 86_400_000;

function predict(input: string, frecency: Frecency = {}) {
	return predictCommands(parseCommand(input), COMMAND_SPECS, frecency, NOW);
}

describe('predictCommands', () => {
	test('a lone slash offers every command', () => {
		expect(predict('/')).toHaveLength(COMMAND_SPECS.length);
	});

	test('a partial name narrows to matching commands', () => {
		const labels = predict('/con').map((suggestion) => suggestion.label);

		expect(labels).toContain('/config');
	});

	test('an abbreviation still finds the command', () => {
		// `cfg` is not a prefix of `config`, but it is a subsequence.
		const labels = predict('/cfg').map((suggestion) => suggestion.label);

		expect(labels[0]).toBe('/config');
	});

	test('a complete name with a trailing space offers its flags', () => {
		const labels = predict('/config ').map((suggestion) => suggestion.label);

		expect(labels).toContain('/config --theme');
		expect(labels).toContain('/config --density');
	});

	test('a partial flag narrows to matching flags', () => {
		const labels = predict('/config --th').map((suggestion) => suggestion.label);

		expect(labels).toEqual(['/config --theme']);
	});

	test('a flag awaiting a value offers that value', () => {
		const labels = predict('/config --theme ').map((suggestion) => suggestion.label);

		expect(labels).toEqual([
			'/config --theme system',
			'/config --theme light',
			'/config --theme dark',
		]);
	});

	test('a partial value narrows to matching values', () => {
		const labels = predict('/config --theme da').map((suggestion) => suggestion.label);

		expect(labels).toEqual(['/config --theme dark']);
	});

	test('a command with no flags still offers itself once complete', () => {
		const labels = predict('/help ').map((suggestion) => suggestion.label);

		expect(labels).toEqual(['/help']);
	});

	test('a command that cannot run yet says why instead of pretending', () => {
		const found = predict('/find').find((suggestion) => suggestion.label === '/find');

		expect(found?.action).toEqual({
			kind: 'unavailable',
			reason: 'File search needs a backend command that is not built yet',
		});
	});

	test('offers something at every stage of a command being typed', () => {
		for (const input of ['/', '/con', '/config', '/config ', '/config --', '/config --theme ']) {
			expect(predict(input).length).toBeGreaterThan(0);
		}
	});

	test('a fragment matching no command offers nothing', () => {
		// Deliberately empty rather than falling back to the full list. Showing
		// every command to someone who typed `/zz` is not help, it is noise —
		// the bar renders an empty state instead, which at least says so.
		expect(predict('/zz')).toEqual([]);
	});

	test('a flag that takes a value completes with a trailing space', () => {
		// So the value chips appear without the user having to press space.
		const theme = predict('/config --th')[0];

		expect(theme?.completion).toBe('/config --theme ');
	});
});

describe('frecency', () => {
	test('a command never run gets no bonus', () => {
		expect(frecencyBonus({}, 'run', NOW)).toBe(0);
	});

	test('running a command raises its bonus', () => {
		const history = recordRun({}, 'run', NOW);

		expect(frecencyBonus(history, 'run', NOW)).toBeGreaterThan(0);
	});

	test('an old habit is worth less than a recent one', () => {
		const stale = { run: { count: 30, lastRunAt: NOW - 30 * DAY } };
		const fresh = { run: { count: 2, lastRunAt: NOW } };

		expect(frecencyBonus(fresh, 'run', NOW)).toBeGreaterThan(frecencyBonus(stale, 'run', NOW));
	});

	test('is capped, so history cannot outrank a better match', () => {
		const obsessive = { run: { count: 100_000, lastRunAt: NOW } };

		expect(frecencyBonus(obsessive, 'run', NOW)).toBeLessThanOrEqual(12);
	});

	test('history reorders equally good matches', () => {
		// `/pin` and `/quit` both contain no shared prefix with the other, so
		// only usage separates them once both match.
		const withoutHistory = predict('/');
		const withHistory = predict('/', recordRun(recordRun({}, 'quit', NOW), 'quit', NOW));

		expect(withHistory[0]?.label).toBe('/quit');
		expect(withoutHistory[0]?.label).not.toBe('/quit');
	});

	test('recording a run does not mutate the history it was given', () => {
		const original: Frecency = {};
		recordRun(original, 'run', NOW);

		expect(original).toEqual({});
	});
});

describe('ghostCompletion', () => {
	test('shows the remainder of the best match', () => {
		expect(ghostCompletion('/con', predict('/con'))).toBe('fig ');
	});

	test('is empty when nothing is typed', () => {
		expect(ghostCompletion('', predict('/'))).toBe('');
	});

	test('is empty when the match is fuzzy rather than a prefix', () => {
		// `/cfg` finds `/config`, but ghosting "onfig " after "cfg" would show
		// text that pressing Tab does not produce.
		expect(ghostCompletion('/cfg', predict('/cfg'))).toBe('');
	});

	test('is empty once the input already equals the completion', () => {
		expect(ghostCompletion('/help', predict('/help'))).toBe('');
	});

	test('is case-insensitive about what counts as a prefix', () => {
		expect(ghostCompletion('/CON', predict('/con'))).toBe('fig ');
	});
});
