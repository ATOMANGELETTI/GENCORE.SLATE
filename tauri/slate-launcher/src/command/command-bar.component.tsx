import { SearchIcon } from '@slate/icons';
import { cn } from '@slate/ui-kit';
import { useEffect, useRef } from 'react';

/**
 * The prompt at the top of the window: a search box and a shell in one control.
 *
 * A leading `/` switches it from filtering applications to composing a command,
 * and the switch is visible rather than modal — the glyph changes from a
 * magnifier to an accent slash, so the bar always says which of the two it is
 * doing.
 *
 * # The ghost completion
 *
 * The rest of the best match is drawn after the caret in tertiary text, and Tab
 * accepts it. It is rendered as an overlay rather than as part of the input's
 * value, because putting it in the value would mean the user's own text and the
 * suggestion were the same string — every keystroke would then have to work out
 * which part to delete, and selecting the text would select the suggestion too.
 *
 * The overlay has to match the input's metrics exactly, so both are set in the
 * same mono face at the same size with the same padding. The leading span is
 * `invisible` rather than absent: it takes up the width of what has been typed,
 * which is what puts the ghost immediately after the caret without measuring
 * anything.
 */

type CommandBarProps = {
	query: string;
	/** The remainder of the best match, or empty when there is nothing to offer. */
	ghost: string;
	/** Shown at the right — a match count, or a keyboard hint. */
	trailing?: React.ReactNode;
	onQueryChange: (query: string) => void;
	onAccept: () => void;
	onRun: () => void;
	onMove: (delta: number) => void;
	onDismiss: () => void;
};

export function CommandBar({
	query,
	ghost,
	trailing,
	onQueryChange,
	onAccept,
	onRun,
	onMove,
	onDismiss,
}: CommandBarProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const isCommandMode = query.startsWith('/');

	// Ctrl+K from anywhere in the window. Synchronising with an event source
	// outside React is what `useEffect` is for; the cleanup is not optional,
	// because a second listener would focus the bar twice per press.
	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
				event.preventDefault();
				inputRef.current?.focus();
				inputRef.current?.select();
			}
		};

		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, []);

	return (
		<div
			className={cn(
				'flex shrink-0 items-center gap-2.5 px-4',
				'h-[var(--slate-chrome-commandBarHeight)]',
			)}
		>
			{isCommandMode ? (
				<span
					aria-hidden="true"
					className="shrink-0 font-mono text-md font-medium text-accent-default"
				>
					/
				</span>
			) : (
				<SearchIcon
					strokeWidth={1.5}
					aria-hidden="true"
					className="size-4 shrink-0 text-tertiary"
				/>
			)}

			<div className="relative min-w-0 flex-1">
				{/* Sits under the input and never receives a pointer. The first
				    span is invisible rather than absent so it reserves the width
				    of what has been typed, placing the ghost at the caret. */}
				{ghost ? (
					<div
						aria-hidden="true"
						className="pointer-events-none absolute inset-0 flex items-center overflow-hidden whitespace-pre font-mono text-base"
					>
						<span className="invisible">{query}</span>
						<span className="text-tertiary">{ghost}</span>
					</div>
				) : null}

				<input
					ref={inputRef}
					value={query}
					onChange={(event) => onQueryChange(event.target.value)}
					onKeyDown={(event) => {
						switch (event.key) {
							case 'ArrowDown':
								event.preventDefault();
								onMove(1);
								break;
							case 'ArrowUp':
								event.preventDefault();
								onMove(-1);
								break;
							case 'Tab':
								// Only when there is something to accept, so Tab
								// still moves focus out of an idle bar.
								if (ghost) {
									event.preventDefault();
									onAccept();
								}
								break;
							case 'Enter':
								event.preventDefault();
								onRun();
								break;
							case 'Escape':
								event.preventDefault();
								onDismiss();
								break;
							default:
								break;
						}
					}}
					// The bar has no visible label: the glyph beside it and the
					// placeholder say what it is, and a label above a single
					// full-width prompt would be a line of chrome for nothing.
					aria-label="Search applications, or type a slash for commands"
					placeholder="Search, or type / for commands"
					spellCheck={false}
					autoComplete="off"
					className={cn(
						'relative w-full bg-transparent font-mono text-base text-primary outline-none',
						'placeholder:font-sans placeholder:text-tertiary',
					)}
				/>
			</div>

			{trailing ? <div className="shrink-0">{trailing}</div> : null}
		</div>
	);
}
