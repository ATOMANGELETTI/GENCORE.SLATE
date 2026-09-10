import type { ThemeMode } from '@slate/bindings';
import type { AccentName, DensityName } from '@slate/tokens';

import { APPS } from '../data/apps.constants.ts';
import { FOLDERS } from '../data/folders.constants.ts';
import { rankByMatch } from '../search/fuzzy-match.util.ts';
import type { ViewId } from '../views/view.types.ts';
import { parseCommand } from './parse-command.util.ts';

/**
 * Turning a typed command into something happening.
 *
 * Every effect arrives as a callback rather than being reached for directly, so
 * this module imports no store, no IPC client and no React. That is what makes
 * it testable by handing it a set of spies and reading which one was called —
 * the alternative is a function that can only be tested by rendering a window.
 *
 * What it deliberately does not do is validate. The predictor has already
 * decided what is offered, and a command that reaches here has been chosen from
 * that list; anything unrecognised is ignored rather than reported, because the
 * bar never runs a command the user did not pick from its own suggestions.
 */

export type CommandHandlers = {
	openView: (view: ViewId) => void;
	closeView: () => void;
	setQuery: (query: string) => void;
	togglePin: (appId: string) => void;
	setAccent: (accent: AccentName) => void;
	setDensity: (density: DensityName) => void;
	setTheme: (theme: ThemeMode) => void;
	launch: (appId: string) => void;
	revealFolder: (folderId: string) => void;
	quit: () => void;
};

const THEMES = new Set<ThemeMode>(['system', 'light', 'dark']);
const ACCENTS = new Set<AccentName>(['teal', 'cyan', 'blue']);
const DENSITIES = new Set<DensityName>(['comfortable', 'compact']);

/** The first flag that was given, ignoring any value. */
function firstFlag(flags: Record<string, string | true>): string | undefined {
	return Object.keys(flags).find((flag) => flag.length > 0);
}

/**
 * Finds the application a `/pin terminal` style argument names.
 *
 * Matched fuzzily against the same names the list shows, so what works in the
 * search box works here — a user who found an application by typing `dwn`
 * should not have to spell it out to pin it.
 */
function resolveApp(term: string | undefined): string | undefined {
	if (!term) {
		return undefined;
	}

	return rankByMatch(APPS, term, (app) => app.name)[0]?.item.id;
}

/**
 * Applies whichever of `/config`'s flags were given.
 *
 * Its own function because `runCommand` is a switch over a dozen commands, and
 * one arm quietly growing three nested checks is how that switch stops being
 * readable at a glance.
 */
function applyConfig(flags: Record<string, string | true>, handlers: CommandHandlers): void {
	const { theme, accent, density } = flags;

	if (typeof theme === 'string' && THEMES.has(theme as ThemeMode)) {
		handlers.setTheme(theme as ThemeMode);
	}
	if (typeof accent === 'string' && ACCENTS.has(accent as AccentName)) {
		handlers.setAccent(accent as AccentName);
	}
	if (typeof density === 'string' && DENSITIES.has(density as DensityName)) {
		handlers.setDensity(density as DensityName);
	}
}

/** Runs a command line that the predictor produced. */
export function runCommand(input: string, handlers: CommandHandlers): void {
	const parsed = parseCommand(input);
	const flag = firstFlag(parsed.flags);
	const [firstWord] = parsed.positional;

	// Every branch clears the bar. Leaving the command in place after running it
	// would mean the next Enter ran it again, which is how a `/quit` gets
	// pressed twice.
	const done = () => handlers.setQuery('');

	switch (parsed.name) {
		case 'run': {
			const appId = flag ? `slate-${flag}` : resolveApp(firstWord);
			if (appId) {
				handlers.launch(appId);
			}
			done();
			return;
		}

		case 'open': {
			const folder = FOLDERS.find((entry) => entry.id === (flag ?? firstWord));
			if (folder) {
				handlers.revealFolder(folder.id);
			}
			done();
			return;
		}

		case 'reveal': {
			// `--root`, `--config` and `--logs` are suite directories rather
			// than storage folders, so they are passed through by name and
			// resolved on the Rust side by `slate-paths`.
			handlers.revealFolder(flag ?? 'root');
			done();
			return;
		}

		case 'config':
			applyConfig(parsed.flags, handlers);
			done();
			return;

		case 'theme': {
			if (firstWord && THEMES.has(firstWord as ThemeMode)) {
				handlers.setTheme(firstWord as ThemeMode);
			}
			done();
			return;
		}

		case 'pin':
		case 'unpin': {
			const appId = resolveApp(firstWord);
			if (appId) {
				handlers.togglePin(appId);
			}
			done();
			return;
		}

		case 'add':
			handlers.openView('add');
			done();
			return;

		case 'about':
			handlers.openView('about');
			done();
			return;

		case 'help':
			handlers.openView('help');
			done();
			return;

		case 'quit':
			handlers.quit();
			done();
			return;

		default:
			// `/find` and anything else the predictor listed as unavailable.
			// Clearing the bar is still right: the command was chosen, it simply
			// has nothing to do yet.
			done();
	}
}
