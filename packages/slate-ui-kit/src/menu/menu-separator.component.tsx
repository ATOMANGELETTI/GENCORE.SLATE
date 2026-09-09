import { cn } from '../lib/cn.util.ts';

/**
 * The rule between two groups of menu items.
 *
 * An `<hr>` rather than a `<div role="separator">`: the element already means
 * exactly this, and a real separator is not focusable, so the `aria-valuenow`
 * that a focusable one would need never applies.
 *
 * Full-bleed — it runs the whole width of the surface rather than being inset
 * to the label column, which is what makes the groups read as separate regions
 * instead of as a stray line.
 */

type MenuSeparatorProps = React.ComponentPropsWithRef<'hr'>;

export function MenuSeparator({ className, ...props }: MenuSeparatorProps) {
	return (
		<hr
			className={cn(
				'-mx-[var(--slate-chrome-menuPadding)] my-1 h-px shrink-0 border-0 bg-hairline',
				className,
			)}
			{...props}
		/>
	);
}
