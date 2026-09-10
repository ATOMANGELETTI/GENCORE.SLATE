import { SectionLabel } from '@slate/ui-kit';
import type { AppSection } from './app.types.ts';
import { AppRow } from './app-row.component.tsx';

/**
 * The Launcher's left column: every application, grouped.
 *
 * Sections are `banded` rather than floating, because this list scrolls. A
 * label that floats in padding disappears the moment it scrolls past, and then
 * a user halfway down a list of twenty has no way to tell whether they are
 * looking at suite applications or portable ones.
 *
 * Each group is a `<nav>` named by its own label, so a screen reader announces
 * "portable apps, navigation, sixteen items" rather than presenting one
 * undifferentiated run of buttons.
 */

type AppListProps = {
	sections: AppSection[];
	/** Index into the flattened list, so the highlight can cross a section boundary. */
	selectedIndex: number;
	onSelect: (index: number) => void;
	onLaunch: (appId: string) => void;
	/** Shown when the query matches nothing. */
	emptyMessage?: string;
};

export function AppList({
	sections,
	selectedIndex,
	onSelect,
	onLaunch,
	emptyMessage = 'No applications match',
}: AppListProps) {
	if (sections.length === 0) {
		return (
			<div className="flex flex-1 items-center justify-center px-6 text-center">
				<p className="text-sm text-tertiary">{emptyMessage}</p>
			</div>
		);
	}

	// Counted across sections rather than within them: the highlight moves
	// down the column the user sees, not down whichever group it started in.
	let flatIndex = -1;

	return (
		<div className="flex-1 overflow-y-auto pb-2">
			{sections.map((section) => {
				const labelId = `app-section-${section.group}`;

				return (
					<div key={section.group}>
						<SectionLabel tone="banded" id={labelId}>
							{section.label}
						</SectionLabel>

						<nav aria-labelledby={labelId} className="flex flex-col px-2 pt-1">
							{section.apps.map((app) => {
								flatIndex += 1;
								const index = flatIndex;

								return (
									<AppRow
										key={app.id}
										app={app}
										isSelected={index === selectedIndex}
										onSelect={() => onSelect(index)}
										onLaunch={() => onLaunch(app.id)}
									/>
								);
							})}
						</nav>
					</div>
				);
			})}
		</div>
	);
}
