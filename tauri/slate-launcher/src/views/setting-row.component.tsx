import { cn } from '@slate/ui-kit';

/**
 * A labelled row with a control on the right.
 *
 * Shared by every view rather than by every settings view, because "a thing,
 * what it does, and how to change it" is the shape of most of what a view
 * shows — a folder with its size, a version with its build, a setting with its
 * switch. Hairline-separated rather than carded, per the design system's
 * preference for rules over boxes in a dense list.
 *
 * The label is sentence case, deliberately. Uppercase is for structural
 * labelling; a setting's name sits beside a sentence of description, and
 * shouting one half of that pairing reads as an error.
 */

type SettingRowProps = {
	label: string;
	description?: string;
	/** The control, value, or action. */
	children?: React.ReactNode;
	className?: string;
};

export function SettingRow({ label, description, children, className }: SettingRowProps) {
	return (
		<div
			className={cn(
				'flex items-center justify-between gap-6 border-b border-hairline py-3',
				className,
			)}
		>
			<div className="min-w-0">
				<div className="text-base text-primary">{label}</div>
				{description ? <div className="text-xs text-tertiary">{description}</div> : null}
			</div>
			{children ? <div className="shrink-0">{children}</div> : null}
		</div>
	);
}

/** The heading at the top of a view's body. */
export function ViewHeading({ children }: { children: React.ReactNode }) {
	return <h2 className="mb-4 text-lg font-semibold tracking-tight text-primary">{children}</h2>;
}

/**
 * What a view says when its section is designed but not yet built.
 *
 * An empty state that names the thing and says plainly that it does not work
 * yet, rather than a spinner or a blank panel. `.agents/rules/06-design-system.md`
 * makes the same point about disabled menu items: a control that explains
 * itself respects the reader's time, and one that does not wastes it.
 */
export function NotBuiltYet({ what, why }: { what: string; why: string }) {
	return (
		<div className="rounded-lg border border-hairline bg-inset px-4 py-3">
			<div className="text-base text-secondary">{what}</div>
			<p className="mt-1 max-w-prose text-xs text-tertiary">{why}</p>
		</div>
	);
}
