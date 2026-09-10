import { Button } from '@slate/ui-kit';
import type { LauncherApp } from '../apps/app.types.ts';
import { APP_ICONS } from '../apps/app-icon.constants.ts';
import { NotBuiltYet, ViewHeading } from './setting-row.component.tsx';

/**
 * The applications with a newer version available.
 *
 * Reached from the count in the status bar rather than from the rail, because
 * it is a view you want only when there is something in it — a permanent button
 * for a list that is usually empty would be a button that usually disappoints.
 */

type UpdatesViewProps = {
	apps: LauncherApp[];
};

export function UpdatesView({ apps }: UpdatesViewProps) {
	const outdated = apps.filter((app) => app.state === 'update');

	return (
		<>
			<ViewHeading>Updates</ViewHeading>

			{outdated.length === 0 ? (
				<p className="text-sm text-tertiary">Everything is up to date.</p>
			) : (
				<>
					<div className="mb-5 flex flex-col">
						{outdated.map((app) => {
							const Icon = APP_ICONS[app.icon];

							return (
								<div key={app.id} className="flex items-center gap-3 border-b border-hairline py-3">
									<Icon
										strokeWidth={1.5}
										aria-hidden="true"
										className="size-[17px] shrink-0 text-tertiary"
									/>
									<div className="min-w-0 flex-1">
										<div className="truncate text-sm uppercase tracking-wide text-primary">
											{app.name}
										</div>
										<div className="text-xs text-tertiary">{app.source}</div>
									</div>
									<span className="shrink-0 font-mono text-xs text-tertiary">{app.version}</span>
									<Button size="sm" disabled>
										Update
									</Button>
								</div>
							);
						})}
					</div>

					<NotBuiltYet
						what="Updating is not connected"
						why="Knowing a newer version exists means asking a catalogue, and installing it means writing into programs/ — the same network and filesystem permissions the Add application view needs. The list above comes from the placeholder data, so the count is real in shape only."
					/>
				</>
			)}
		</>
	);
}
