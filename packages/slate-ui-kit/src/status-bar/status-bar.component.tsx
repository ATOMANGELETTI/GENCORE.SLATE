import { cn } from '../lib/cn.util.ts';

/**
 * The bar along the bottom of every window.
 *
 * Three slots, so that content in one application's status bar lines up with
 * the next application's. Deliberately quiet: 11px, tertiary text, a hairline
 * top border, and no background of its own beyond the surface.
 */

type StatusBarProps = {
	leading?: React.ReactNode;
	center?: React.ReactNode;
	trailing?: React.ReactNode;
	className?: string;
};

export function StatusBar({ leading, center, trailing, className }: StatusBarProps) {
	return (
		<footer
			className={cn(
				'flex h-[var(--slate-chrome-statusbarHeight)] shrink-0 items-center justify-between',
				'border-t border-hairline bg-surface px-3',
				'text-xs text-tertiary select-none',
				className,
			)}
		>
			<div className="flex min-w-0 items-center gap-2 truncate">{leading}</div>
			<div className="flex min-w-0 items-center gap-2 truncate">{center}</div>
			<div className="flex min-w-0 items-center gap-2 truncate">{trailing}</div>
		</footer>
	);
}

type StatusItemProps = {
	/** Short label, e.g. "Ready" or "3 items". */
	children: React.ReactNode;
	/** Tints the item to signal state. */
	tone?: 'default' | 'success' | 'warning' | 'danger';
	className?: string;
};

const TONE_CLASS = {
	default: 'text-tertiary',
	success: 'text-status-success',
	warning: 'text-status-warning',
	danger: 'text-status-danger',
} as const;

/** A single labelled item inside a status bar slot. */
export function StatusItem({ children, tone = 'default', className }: StatusItemProps) {
	return (
		<span className={cn('truncate tabular-nums', TONE_CLASS[tone], className)}>{children}</span>
	);
}
