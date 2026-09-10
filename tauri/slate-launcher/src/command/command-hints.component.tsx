import { cn, KeyHint } from '@slate/ui-kit';

import type { CommandSpec, ParsedCommand } from './command.types.ts';

/**
 * The strip under the prompt: what the command being typed accepts next.
 *
 * This is the part that makes the command system learnable. A user who types
 * `/config --theme ` sees `system light dark` appear beneath the caret, with
 * the one they have started typing lit — so the syntax is learned by using it,
 * and `/help` becomes a reference rather than a prerequisite.
 *
 * It shows the flags of the command until one is chosen, then the values of
 * that flag. Nothing is shown for a command with no arguments, because a strip
 * that appeared empty would be a row of chrome saying "there is nothing here".
 */

type CommandHintsProps = {
	spec: CommandSpec | undefined;
	parsed: ParsedCommand;
};

export function CommandHints({ spec, parsed }: CommandHintsProps) {
	if (!spec) {
		return null;
	}

	// Which flag's values to show, if the user has committed to a flag that
	// takes one. Matching on the parsed flags rather than on the raw text keeps
	// this agreeing with the predictor about what stage the input is at.
	const activeArg = spec.args.find(
		(arg) => arg.values !== undefined && parsed.flags[arg.flag] !== undefined,
	);

	const chips = activeArg?.values
		? activeArg.values.map((value) => ({
				key: value,
				label: value,
				isActive: parsed.flags[activeArg.flag] === value,
			}))
		: spec.args.map((arg) => ({
				key: arg.flag,
				label: `--${arg.flag}`,
				isActive: parsed.flags[arg.flag] !== undefined,
			}));

	if (chips.length === 0 && !spec.unavailableReason) {
		return null;
	}

	return (
		<div
			className={cn(
				'flex shrink-0 items-center gap-1.5 px-4 pb-2.5',
				'min-h-[var(--slate-chrome-commandHintsHeight)]',
			)}
		>
			{spec.unavailableReason ? (
				<span className="text-xs text-status-warning">{spec.unavailableReason}</span>
			) : (
				<>
					{chips.map((chip) => (
						<span
							key={chip.key}
							className={cn(
								'rounded-sm border px-2 py-0.5 font-mono text-2xs',
								chip.isActive
									? 'border-accent-default/40 text-accent-default'
									: 'border-hairline text-tertiary',
							)}
						>
							{chip.label}
						</span>
					))}
					<span className="flex-1" />
					<KeyHint keys={['ENTER']}>Run</KeyHint>
				</>
			)}
		</div>
	);
}
