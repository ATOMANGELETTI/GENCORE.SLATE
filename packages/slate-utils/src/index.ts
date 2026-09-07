/**
 * `@slate/utils` — small pure helpers.
 *
 * Every export here has a name that says what it does. This package is
 * explicitly **not** a `utils` dumping ground: if something does not fit one
 * of these named concerns, it belongs in the module that uses it, or in a new
 * package with a real name. See `.agents/rules/03-naming-and-structure.md`.
 */

/** Formats a byte count the way a file manager should — base 10, one decimal. */
export function formatBytes(bytes: number): string {
	if (!Number.isFinite(bytes) || bytes < 0) {
		return '—';
	}
	if (bytes < 1000) {
		return `${bytes} B`;
	}

	const units = ['kB', 'MB', 'GB', 'TB', 'PB'];
	let value = bytes / 1000;
	let unit = 0;

	while (value >= 1000 && unit < units.length - 1) {
		value /= 1000;
		unit += 1;
	}

	return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
}

/**
 * Returns a debounced version of `fn`.
 *
 * Used for things like persisting window geometry, where a resize produces
 * dozens of events and only the last one matters.
 */
export function debounce<Args extends unknown[]>(
	fn: (...args: Args) => void,
	delayMs: number,
): ((...args: Args) => void) & { cancel: () => void } {
	let timer: ReturnType<typeof setTimeout> | undefined;

	const debounced = (...args: Args) => {
		if (timer !== undefined) {
			clearTimeout(timer);
		}
		timer = setTimeout(() => fn(...args), delayMs);
	};

	debounced.cancel = () => {
		if (timer !== undefined) {
			clearTimeout(timer);
			timer = undefined;
		}
	};

	return debounced;
}

/**
 * Constrains a number to a range.
 *
 * Returns `min` when the bounds are inverted rather than producing nonsense.
 */
export function clamp(value: number, min: number, max: number): number {
	if (min > max) {
		return min;
	}
	return Math.min(Math.max(value, min), max);
}

/**
 * Formats a duration in milliseconds for a status bar.
 *
 * Deliberately coarse: a status bar reports magnitude, not precision.
 */
export function formatDuration(milliseconds: number): string {
	if (!Number.isFinite(milliseconds) || milliseconds < 0) {
		return '—';
	}
	if (milliseconds < 1000) {
		return `${Math.round(milliseconds)} ms`;
	}
	if (milliseconds < 60_000) {
		return `${(milliseconds / 1000).toFixed(1)} s`;
	}

	const minutes = Math.floor(milliseconds / 60_000);
	const seconds = Math.round((milliseconds % 60_000) / 1000);
	return `${minutes}m ${seconds}s`;
}
