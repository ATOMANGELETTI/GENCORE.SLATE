import { CloseIcon } from '@slate/icons';

import { rankByMatch } from '../search/fuzzy-match.util.ts';
import type { CommandSpec, ParsedCommand, Suggestion } from './command.types.ts';
import { findCommand } from './commands.registry.ts';

/**
 * What to offer for what has been typed so far.
 *
 * Three stages, in this order, because that is the order the input becomes
 * specific: the user names a command, then a flag, then a value. Each stage
 * only runs when the one before it has an unambiguous answer, which is what
 * stops `/con` from offering theme values it has no reason to believe are
 * wanted yet.
 *
 * Pure, and deliberately so. It takes the parsed input and returns rows; it
 * does not launch anything, does not read a store, and does not know what a
 * React component is. Everything it suggests carries an `action` describing
 * what running it would mean, and the bar is what performs it. That is what
 * makes the hardest part of the command bar testable against plain strings.
 */

/** How often and how recently a command has been run. */
export type Frecency = Record<string, { count: number; lastRunAt: number }>;

/**
 * How much a command's history is allowed to move it up the list.
 *
 * Capped on purpose. Frecency should break ties between things that already
 * match, never drag a poor match above a good one — a list that reorders itself
 * out from under a user who typed one more character has stopped being
 * predictable, which is the only thing a command bar has to be.
 */
const MAX_FRECENCY_BONUS = 12;
const DAY_MS = 86_400_000;

/**
 * A small bonus from usage: frequency, decayed by how long ago it was.
 *
 * A command run thirty times last month should not outrank one run twice this
 * morning, which a raw count would allow.
 */
export function frecencyBonus(frecency: Frecency, name: string, now: number): number {
	const entry = frecency[name];
	if (!entry) {
		return 0;
	}

	const ageDays = Math.max(0, (now - entry.lastRunAt) / DAY_MS);
	const recency = 1 / (1 + ageDays);

	return Math.min(MAX_FRECENCY_BONUS, Math.log1p(entry.count) * 4 * recency);
}

/** Records that a command was run, for the next prediction. */
export function recordRun(frecency: Frecency, name: string, now: number): Frecency {
	const entry = frecency[name];

	return { ...frecency, [name]: { count: (entry?.count ?? 0) + 1, lastRunAt: now } };
}

/** The commands matching a partial name, best first. */
function suggestCommands(
	parsed: ParsedCommand,
	specs: CommandSpec[],
	frecency: Frecency,
	now: number,
): Suggestion[] {
	const ranked = rankByMatch(specs, parsed.name, (spec) => spec.name);

	return ranked
		.map(({ item, match }) => ({
			spec: item,
			score: match.score + frecencyBonus(frecency, item.name, now),
		}))
		.sort((a, b) => b.score - a.score)
		.map(({ spec }) => toCommandSuggestion(spec));
}

function toCommandSuggestion(spec: CommandSpec): Suggestion {
	return {
		id: `command:${spec.name}`,
		icon: spec.unavailableReason ? CloseIcon : spec.icon,
		label: `/${spec.name}`,
		detail: spec.args.length > 0 ? `${spec.args.length} options` : undefined,
		description: spec.unavailableReason ?? spec.summary,
		// A command with flags completes to a trailing space, so the hint strip
		// appears immediately and the next token can be typed without one.
		completion: spec.args.length > 0 ? `/${spec.name} ` : `/${spec.name}`,
		action: spec.unavailableReason
			? { kind: 'unavailable', reason: spec.unavailableReason }
			: { kind: 'command', text: `/${spec.name}` },
		isMono: true,
	};
}

/** The flags of a known command, matching whatever the user is typing. */
function suggestFlags(spec: CommandSpec, parsed: ParsedCommand): Suggestion[] {
	const typed = parsed.currentToken.startsWith('--') ? parsed.currentToken.slice(2) : '';
	const ranked = rankByMatch(spec.args, typed, (arg) => arg.flag);

	return ranked.map(({ item }) => ({
		id: `flag:${spec.name}:${item.flag}`,
		icon: spec.icon,
		label: `/${spec.name} --${item.flag}`,
		description: item.description,
		completion: `/${spec.name} --${item.flag}${item.takesValue ? ' ' : ''}`,
		action: { kind: 'command', text: `/${spec.name} --${item.flag}` },
		isMono: true,
	}));
}

/** The values a flag accepts, once that flag is known and takes one. */
function suggestValues(spec: CommandSpec, parsed: ParsedCommand): Suggestion[] | null {
	// The flag whose value is still being typed: present in the input, declared
	// to take a value, and either unset or holding the fragment at the caret.
	const pending = spec.args.find((arg) => {
		if (!arg.takesValue || arg.values === undefined) {
			return false;
		}
		const given = parsed.flags[arg.flag];
		return given === true || (typeof given === 'string' && given === parsed.currentToken);
	});

	if (!pending?.values) {
		return null;
	}

	const typed = parsed.currentToken.startsWith('--') ? '' : parsed.currentToken;

	return rankByMatch(pending.values, typed, (value) => value).map(({ item }) => ({
		id: `value:${spec.name}:${pending.flag}:${item}`,
		icon: spec.icon,
		label: `/${spec.name} --${pending.flag} ${item}`,
		description: pending.description,
		completion: `/${spec.name} --${pending.flag} ${item}`,
		action: { kind: 'command', text: `/${spec.name} --${pending.flag} ${item}` },
		isMono: true,
	}));
}

/**
 * The rows to show for a command-mode query.
 *
 * Falls back to the command list whenever the more specific stages have nothing
 * to say, so the bar is never empty while the user is mid-word.
 */
export function predictCommands(
	parsed: ParsedCommand,
	specs: CommandSpec[],
	frecency: Frecency,
	now: number,
): Suggestion[] {
	const spec = findCommand(parsed.name);

	// Still naming the command: either it matches nothing yet, or it matches
	// exactly but the user has not typed the space that would move them on.
	if (!spec || (!parsed.isAtNewToken && parsed.currentToken === parsed.name)) {
		return suggestCommands(parsed, specs, frecency, now);
	}

	const values = suggestValues(spec, parsed);
	if (values && values.length > 0) {
		return values;
	}

	const flags = suggestFlags(spec, parsed);
	if (flags.length > 0) {
		return flags;
	}

	return [toCommandSuggestion(spec)];
}

/**
 * The completion to show as ghost text after the caret.
 *
 * Only ever the *remainder* of the best suggestion, and only when what is typed
 * is a genuine prefix of it. A ghost that appeared for a fuzzy match would show
 * text that pressing Tab does not produce, which is worse than no ghost at all.
 */
export function ghostCompletion(query: string, suggestions: Suggestion[]): string {
	const best = suggestions[0];
	if (!best || query.length === 0) {
		return '';
	}

	const lowerQuery = query.toLowerCase();
	const lowerCompletion = best.completion.toLowerCase();

	if (!lowerCompletion.startsWith(lowerQuery) || lowerCompletion === lowerQuery) {
		return '';
	}

	return best.completion.slice(query.length);
}
