import type { SlateIcon } from '@slate/icons';

/**
 * The slash-command vocabulary.
 *
 * A command is described as data, not as a function, so the same description
 * drives the prediction, the argument hints, and the `/help` reference. A
 * command whose help text is written separately from its parser is a command
 * whose help text is wrong within a month.
 */

/** One `--flag` a command accepts. */
export type CommandArg = {
	/** Without the dashes: `theme`, not `--theme`. */
	flag: string;
	/** What it does. One short line — this appears in `/help`. */
	description: string;
	/**
	 * The values the flag accepts, if it is a closed set.
	 *
	 * These become the chips in the hint strip under the prompt, which is how
	 * the syntax is learned by using it rather than by reading `/help` first.
	 */
	values?: string[];
	/** Whether the flag needs a value at all. */
	takesValue?: boolean;
};

export type CommandSpec = {
	/** Without the slash: `run`, not `/run`. */
	name: string;
	summary: string;
	icon: SlateIcon;
	args: CommandArg[];
	/** A complete, runnable example. Shown in `/help`. */
	example: string;
	/**
	 * Set when the command is listed but cannot do anything yet.
	 *
	 * A greyed item with no explanation wastes the reader's time
	 * (`.agents/rules/06-design-system.md`), so this is the explanation. A
	 * command that could *never* work would simply be absent.
	 */
	unavailableReason?: string;
};

/**
 * What the user has typed, taken apart.
 *
 * Deliberately tolerant: this parses half-written input on every keystroke, so
 * every field has a meaning for `/con`, `/config --`, and `/config --theme `
 * alike. It never throws — an unparseable command is one with no name.
 */
export type ParsedCommand = {
	/** The command name, possibly a fragment the user is still typing. */
	name: string;
	/** Flags given, mapped to their value or `true` when they take none. */
	flags: Record<string, string | true>;
	/** Bare words after the command name. */
	positional: string[];
	/**
	 * The token the caret is currently inside, which is what completion acts
	 * on. Empty when the input ends in a space, meaning a new token is starting.
	 */
	currentToken: string;
	/** Whether the input ends in a space, so the next token has begun. */
	isAtNewToken: boolean;
};

/** What a row in the command results does when it is run. */
export type SuggestionAction =
	| { kind: 'command'; text: string }
	| { kind: 'launch'; appId: string }
	| { kind: 'openFolder'; folderId: string }
	| { kind: 'openView'; viewId: string }
	| { kind: 'copy'; text: string }
	| { kind: 'unavailable'; reason: string };

/** One row of the command bar's results. */
export type Suggestion = {
	id: string;
	icon: SlateIcon;
	/** The primary text. Set in mono when it is a command. */
	label: string;
	/** Right-aligned detail — a value, a version, an answer. */
	detail?: string;
	/** A short explanation under or beside the label. */
	description?: string;
	/** What replaces the bar's text when Tab completes this row. */
	completion: string;
	action: SuggestionAction;
	isMono: boolean;
};
