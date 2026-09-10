/**
 * Subsequence matching with a relevance score.
 *
 * Used by both the application list and the command bar, which is why it lives
 * in a concern of its own rather than inside either. Typing `dwn` should find
 * "Downloader" and `cfg th` should find `/config --theme`, and both want the
 * same answer to "does this match, and how well".
 *
 * # How it scores
 *
 * A greedy left-to-right walk, not an optimal alignment. Optimal matching is a
 * dynamic-programming problem and the difference is invisible on strings this
 * short, while the greedy version is predictable — a user who types one more
 * character can see why the order changed.
 *
 * The weights encode one idea: **a match at the start of a word is worth far
 * more than a match in the middle of one.** `cal` should rank "Calculator"
 * above "Critical", even though both contain the letters in order. Everything
 * else is a tiebreak.
 */

/** A successful match: how good it is, and which characters were hit. */
export type FuzzyMatch = {
	/** Higher is better. Comparable only between matches on the same needle. */
	score: number;
	/** Indices into the haystack, for highlighting. Ascending, no duplicates. */
	indices: number[];
};

/** A character that begins a word, so the next one is a boundary. */
const SEPARATORS = new Set([' ', '-', '_', '.', '/', '\\', ':']);

const BOUNDARY_BONUS = 16;
const CONSECUTIVE_BONUS = 8;
const MATCH_SCORE = 4;
/** Per character skipped before the first match, capped so it cannot dominate. */
const LEADING_PENALTY = 1;
const MAX_LEADING_PENALTY = 12;

function isBoundary(haystack: string, index: number): boolean {
	if (index === 0) {
		return true;
	}

	const previous = haystack[index - 1];
	const current = haystack[index];
	if (previous === undefined || current === undefined) {
		return false;
	}

	if (SEPARATORS.has(previous)) {
		return true;
	}

	// A lowercase-to-uppercase transition starts a word in "FileSync", which
	// is exactly the kind of name this list is full of.
	return previous === previous.toLowerCase() && current !== current.toLowerCase();
}

/**
 * Matches `needle` against `haystack`, case-insensitively.
 *
 * An empty needle matches everything with a score of zero, which is what makes
 * an empty search box show the whole list rather than none of it.
 *
 * Returns `null` when the needle is not a subsequence of the haystack.
 */
export function fuzzyMatch(needle: string, haystack: string): FuzzyMatch | null {
	if (needle.length === 0) {
		return { score: 0, indices: [] };
	}
	if (haystack.length === 0) {
		return null;
	}

	const lowerNeedle = needle.toLowerCase();
	const lowerHaystack = haystack.toLowerCase();

	const indices: number[] = [];
	let score = 0;
	let needleIndex = 0;
	let previousMatch = -1;

	for (let index = 0; index < lowerHaystack.length && needleIndex < lowerNeedle.length; index++) {
		if (lowerHaystack[index] !== lowerNeedle[needleIndex]) {
			continue;
		}

		if (indices.length === 0) {
			score -= Math.min(index * LEADING_PENALTY, MAX_LEADING_PENALTY);
		}

		if (isBoundary(haystack, index)) {
			score += BOUNDARY_BONUS;
		} else if (index === previousMatch + 1) {
			score += CONSECUTIVE_BONUS;
		} else {
			score += MATCH_SCORE;
		}

		indices.push(index);
		previousMatch = index;
		needleIndex += 1;
	}

	if (needleIndex < lowerNeedle.length) {
		return null;
	}

	// Ties go to the shorter candidate: with `co` matching both "Code" and
	// "Configuration", the one that is nearly all match is the better answer.
	// Small enough that it can never outweigh a boundary hit.
	score -= haystack.length / 100;

	return { score, indices };
}

/**
 * Ranks candidates by how well they match, discarding those that do not.
 *
 * Stable within a score, so an empty query leaves the caller's own order — the
 * application list's alphabetical grouping — completely untouched.
 */
export function rankByMatch<T>(
	items: T[],
	needle: string,
	toText: (item: T) => string,
): { item: T; match: FuzzyMatch }[] {
	const ranked: { item: T; match: FuzzyMatch; order: number }[] = [];

	for (const [order, item] of items.entries()) {
		const match = fuzzyMatch(needle, toText(item));
		if (match) {
			ranked.push({ item, match, order });
		}
	}

	ranked.sort((a, b) => b.match.score - a.match.score || a.order - b.order);

	return ranked.map(({ item, match }) => ({ item, match }));
}
