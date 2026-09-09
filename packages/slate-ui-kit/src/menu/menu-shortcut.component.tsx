import { cn } from '../lib/cn.util.ts';

/**
 * The keyboard hint at the trailing edge of a menu item.
 *
 * Quiet by design: it is a reminder for people who already know the shortcut,
 * not a second label competing with the first. Rendered in the monospace face
 * so that `Ctrl+H` and `Alt+F4` occupy predictable width down the menu.
 */

type MenuShortcutProps = {
	children: React.ReactNode;
} & React.ComponentPropsWithRef<'span'>;

export function MenuShortcut({ children, className, ...props }: MenuShortcutProps) {
	return (
		<span
			className={cn(
				'ml-auto shrink-0 pl-4 font-mono text-xs tracking-wide',
				// Tertiary rather than secondary, and deliberately not inheriting
				// the danger tone: a red shortcut would read as part of the warning.
				'text-tertiary',
				className,
			)}
			{...props}
		>
			{children}
		</span>
	);
}
