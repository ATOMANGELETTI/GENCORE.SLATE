import { cn, KeyHint, SectionLabel } from '@slate/ui-kit';

import type { Suggestion } from './command.types.ts';

/**
 * The rows a command-mode query produces, in the column the application list
 * usually occupies.
 *
 * Results filter *into the list* rather than dropping over it as a palette.
 * A popover would cover the applications the user can still see out of the
 * corner of their eye, and the whole point of a bar that is both a search and a
 * shell is that the two are one surface rather than two modes stacked on each
 * other.
 */

type CommandResultsProps = {
	suggestions: Suggestion[];
	/** An answer from the expression evaluator, shown above the commands. */
	answer?: { label: string; detail: string } | null;
	selectedIndex: number;
	onSelect: (index: number) => void;
	onRun: (index: number) => void;
};

/**
 * One suggestion.
 *
 * Its own component rather than an inline map, because the row carries four
 * conditional pieces — selection, availability, an optional description and an
 * optional detail — and folding all four into the parent's JSX is how a list
 * becomes unreadable.
 */
function SuggestionRow({
	suggestion,
	isSelected,
	onSelect,
	onRun,
}: {
	suggestion: Suggestion;
	isSelected: boolean;
	onSelect: () => void;
	onRun: () => void;
}) {
	const Icon = suggestion.icon;
	const isUnavailable = suggestion.action.kind === 'unavailable';

	return (
		<button
			type="button"
			onMouseMove={onSelect}
			onFocus={onSelect}
			onClick={onRun}
			aria-current={isSelected ? 'true' : undefined}
			className={cn(
				'flex w-full shrink-0 items-center gap-3 rounded-md px-2 text-left',
				'h-[var(--slate-density-row)]',
				'transition-colors duration-[var(--slate-duration-fast)] ease-standard',
				isSelected ? 'bg-selected text-primary' : 'text-secondary',
				isUnavailable && 'opacity-60',
			)}
		>
			<Icon
				strokeWidth={1.5}
				aria-hidden="true"
				className={cn('size-[17px] shrink-0', isSelected ? 'text-accent-default' : 'text-tertiary')}
			/>

			<span className={cn('shrink-0 truncate text-sm', suggestion.isMono && 'font-mono')}>
				{suggestion.label}
			</span>

			{suggestion.description ? (
				<span className="min-w-0 flex-1 truncate text-xs text-tertiary">
					{suggestion.description}
				</span>
			) : (
				<span className="flex-1" />
			)}

			{suggestion.detail ? (
				<span className="shrink-0 font-mono text-xs text-tertiary">{suggestion.detail}</span>
			) : null}
		</button>
	);
}

export function CommandResults({
	suggestions,
	answer,
	selectedIndex,
	onSelect,
	onRun,
}: CommandResultsProps) {
	if (suggestions.length === 0 && !answer) {
		return (
			<div className="flex flex-1 items-center justify-center px-6 text-center">
				<p className="text-sm text-tertiary">No command matches</p>
			</div>
		);
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="flex-1 overflow-y-auto">
				{answer ? (
					<>
						<SectionLabel tone="banded">Answer</SectionLabel>
						<div className="flex items-center gap-3 px-4 py-3">
							<span className="min-w-0 flex-1 truncate font-mono text-base text-tertiary">
								{answer.label}
							</span>
							<span className="shrink-0 font-mono text-md text-accent-default">
								{answer.detail}
							</span>
						</div>
					</>
				) : null}

				{suggestions.length > 0 ? (
					<>
						<SectionLabel tone="banded">Command</SectionLabel>
						<div className="flex flex-col px-2 pt-1">
							{suggestions.map((suggestion, index) => (
								<SuggestionRow
									key={suggestion.id}
									suggestion={suggestion}
									isSelected={index === selectedIndex}
									onSelect={() => onSelect(index)}
									onRun={() => onRun(index)}
								/>
							))}
						</div>
					</>
				) : null}
			</div>

			<div className="flex shrink-0 items-center gap-4 border-t border-hairline px-4 py-2.5">
				<KeyHint keys={['↑', '↓']}>Select</KeyHint>
				<KeyHint keys={['TAB']}>Complete</KeyHint>
				<KeyHint keys={['ESC']}>Exit</KeyHint>
			</div>
		</div>
	);
}
