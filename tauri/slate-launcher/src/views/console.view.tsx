import { NotBuiltYet, ViewHeading } from './setting-row.component.tsx';

/**
 * A record of what the Launcher has done.
 *
 * Distinct from the Terminal application, which is a shell. This is the
 * Launcher's own log: what it launched, what it opened, what a command did. The
 * value of it is that the command bar is otherwise a place where things happen
 * and vanish.
 */

/**
 * One thing the Launcher did.
 *
 * An identity of its own rather than a bare string, because the same command
 * can be run twice and a list keyed on its text would then have two rows
 * claiming to be the same one.
 */
export type HistoryEntry = {
	id: string;
	text: string;
};

type ConsoleViewProps = {
	sectionId: string;
	/** Commands the user has run this session, newest last. */
	history: HistoryEntry[];
};

export function ConsoleView({ sectionId, history }: ConsoleViewProps) {
	if (sectionId === 'history') {
		return (
			<>
				<ViewHeading>History</ViewHeading>

				{history.length === 0 ? (
					<p className="text-sm text-tertiary">
						Nothing run yet. Type a slash in the bar at the top to start a command.
					</p>
				) : (
					<div className="flex flex-col">
						{[...history].reverse().map((entry, index) => (
							<div key={entry.id} className="flex items-center gap-3 border-b border-hairline py-2">
								<span className="font-mono text-2xs text-tertiary">
									{String(history.length - index).padStart(2, '0')}
								</span>
								<span className="font-mono text-sm text-secondary">{entry.text}</span>
							</div>
						))}
					</div>
				)}
			</>
		);
	}

	return (
		<>
			<ViewHeading>Output</ViewHeading>
			<NotBuiltYet
				what="There is nothing to report yet"
				why="Output belongs here once launching, opening and configuring actually report what they did. Today `/run` starts a process through the supervisor and says nothing back, so an empty pane is the honest state rather than a spinner."
			/>
		</>
	);
}
