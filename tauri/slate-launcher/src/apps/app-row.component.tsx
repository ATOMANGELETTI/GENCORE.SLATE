import { cn } from '@slate/ui-kit';
import type { LauncherApp } from './app.types.ts';
import { APP_ICONS } from './app-icon.constants.ts';

/**
 * One application in the list.
 *
 * The right-hand slot carries exactly one thing, chosen by state: `running` in
 * green, `update` in amber, and otherwise the version number in mono. That is
 * the whole status treatment — no pill, no badge, no dot. Sixteen filled badges
 * would be sixteen things competing with the accent colour, and the design
 * spends its one accent on the selected row instead.
 *
 * Selection is a tinted fill and an accent glyph. It is a highlight, not an
 * activation: Enter launches, and everything else an application can do is on
 * its context menu. That is a deliberate limit — a detail panel that appeared
 * on every arrow-key press would make browsing the list feel like committing to
 * something.
 */

type AppRowProps = {
	app: LauncherApp;
	isSelected: boolean;
	onSelect: () => void;
	onLaunch: () => void;
};

export function AppRow({ app, isSelected, onSelect, onLaunch }: AppRowProps) {
	const Icon = APP_ICONS[app.icon];

	return (
		<button
			type="button"
			// The list owns the highlight, so the row reports its own hover
			// rather than styling it — that keeps keyboard and pointer
			// selection as one concept instead of two that can disagree.
			onMouseMove={onSelect}
			onFocus={onSelect}
			onClick={onLaunch}
			aria-current={isSelected ? 'true' : undefined}
			className={cn(
				'flex w-full shrink-0 items-center gap-3 rounded-md px-2 text-left',
				'h-[var(--slate-density-row)]',
				'transition-colors duration-[var(--slate-duration-fast)] ease-standard',
				isSelected ? 'bg-selected text-primary' : 'text-secondary',
			)}
		>
			<Icon
				strokeWidth={1.5}
				aria-hidden="true"
				className={cn('size-[17px] shrink-0', isSelected ? 'text-accent-default' : 'text-tertiary')}
			/>

			<span className="min-w-0 flex-1 truncate text-sm uppercase tracking-wide">{app.name}</span>

			<span
				className={cn(
					'shrink-0 font-mono text-xs',
					app.state === 'running' && 'text-status-success',
					app.state === 'update' && 'text-status-warning',
					app.state === 'ready' && 'text-tertiary',
				)}
			>
				{app.state === 'running' ? 'running' : app.state === 'update' ? 'update' : app.version}
			</span>
		</button>
	);
}
