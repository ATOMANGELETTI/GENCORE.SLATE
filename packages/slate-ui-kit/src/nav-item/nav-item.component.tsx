import type { SlateIcon } from '@slate/icons';

import { cn } from '../lib/cn.util.ts';
import { type NavItemVariants, navItemVariants } from './nav-item.variants.ts';

/**
 * One row in a navigation list: the folders in the Launcher's rail, and the
 * sections down the left of every expanded view.
 *
 * A real `<button>`, not a styled `<div>`, so it is reachable by keyboard and
 * announced as a control without any of it being hand-rolled. When it is the
 * current selection it carries `aria-current`, which is what tells a screen
 * reader user which of a dozen identical-sounding rows they are actually on.
 */

type NavItemProps = Omit<NavItemVariants, 'isSelected' | 'isUppercase'> & {
	/** The leading glyph. Rendered at a lighter stroke than Lucide's default. */
	icon?: SlateIcon;
	label: string;
	/** Right-aligned content — a count, a size, a chevron. */
	trailing?: React.ReactNode;
	isSelected?: boolean;
	/** Sets the label in capitals with the tracking that makes them legible. */
	isUppercase?: boolean;
} & Omit<React.ComponentPropsWithRef<'button'>, 'children'>;

export function NavItem({
	icon: Icon,
	label,
	trailing,
	isSelected = false,
	isUppercase = false,
	className,
	type = 'button',
	...props
}: NavItemProps) {
	return (
		<button
			type={type}
			aria-current={isSelected ? 'true' : undefined}
			className={cn(navItemVariants({ isSelected, isUppercase }), className)}
			{...props}
		>
			{Icon ? <Icon strokeWidth={1.5} aria-hidden="true" /> : null}
			<span data-nav-label className="min-w-0 flex-1 truncate">
				{label}
			</span>
			{trailing}
		</button>
	);
}
