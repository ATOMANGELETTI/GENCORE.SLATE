import type { SlateIcon } from '@slate/icons';

import { cn } from '../lib/cn.util.ts';

/**
 * The identifying row at the top of the tray menu.
 *
 * The tray is the one place a menu appears with no window around it to say
 * which application it belongs to, so it has to name itself. The context menus
 * inside a window do not use this — there, the title bar has already answered
 * the question.
 */

type MenuHeaderProps = {
	/** The application's name. Rendered in small caps with wide tracking. */
	name: string;
	/** Suite version, shown at the trailing edge. */
	version: string;
	icon?: SlateIcon;
	/**
	 * Whether the application's window is currently open. Drives the status
	 * dot, which is always paired with the label below it rather than being the
	 * only signal.
	 */
	isRunning?: boolean;
	className?: string;
};

export function MenuHeader({
	name,
	version,
	icon: Icon,
	isRunning = true,
	className,
}: MenuHeaderProps) {
	const state = isRunning ? 'Running' : 'Stopped';

	return (
		<div
			className={cn(
				'flex h-[var(--slate-chrome-menuItemHeight)] shrink-0 items-center gap-2 px-2',
				className,
			)}
		>
			<span
				aria-hidden="true"
				className={cn(
					'size-1-5 shrink-0 rounded-full',
					isRunning ? 'bg-status-success' : 'bg-chrome-inactive',
				)}
			/>

			{Icon ? <Icon aria-hidden="true" className="size-4 shrink-0 text-secondary" /> : null}

			<span className="flex-1 truncate text-xs font-bold uppercase tracking-wider text-secondary">
				{name}
			</span>

			{/* The dot's meaning, for anyone not reading colour. */}
			<span className="sr-only">{state}</span>

			<span className="shrink-0 font-mono text-xs text-tertiary">{version}</span>
		</div>
	);
}
