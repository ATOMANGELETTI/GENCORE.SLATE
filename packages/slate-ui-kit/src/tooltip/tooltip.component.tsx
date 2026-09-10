import * as RadixTooltip from '@radix-ui/react-tooltip';

import { cn } from '../lib/cn.util.ts';

/**
 * The name of an icon-only control, on hover or focus.
 *
 * An `aria-label` already answers "what is this?" for a screen reader. A
 * tooltip answers it for everyone else — and the Launcher's five foot buttons
 * are exactly the case that needs it: a row of glyphs with no text, where
 * guessing wrong means opening the wrong view.
 *
 * A tooltip is never the only place a piece of information lives. It cannot be
 * reached by touch, it cannot be selected, and it disappears. If something has
 * to be read, it belongs on the surface.
 */

type TooltipProps = {
	/** The text. Keep it to a couple of words — this names, it does not explain. */
	content: React.ReactNode;
	children: React.ReactNode;
	side?: RadixTooltip.TooltipContentProps['side'];
	/**
	 * Milliseconds before it appears. The default is deliberately unhurried:
	 * a tooltip that fires instantly turns a glance across a toolbar into a
	 * trail of popups.
	 */
	delayDuration?: number;
};

export function Tooltip({ content, children, side = 'top', delayDuration = 500 }: TooltipProps) {
	return (
		<RadixTooltip.Root delayDuration={delayDuration}>
			<RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
			<RadixTooltip.Portal>
				<RadixTooltip.Content
					side={side}
					sideOffset={6}
					className={cn(
						'z-[var(--slate-layer-tooltip)] select-none',
						'rounded-md border border-hairline bg-menu px-2 py-1',
						'text-2xs uppercase tracking-wider text-secondary shadow-md',
						'origin-[var(--radix-tooltip-content-transform-origin)]',
						'data-[state=delayed-open]:animate-[slate-menu-in_var(--slate-duration-fast)_var(--slate-ease-out)]',
					)}
				>
					{content}
				</RadixTooltip.Content>
			</RadixTooltip.Portal>
		</RadixTooltip.Root>
	);
}

/**
 * Wraps the part of the tree that uses tooltips.
 *
 * Radix needs one provider so that moving between neighbouring controls skips
 * the delay — the second tooltip in a row should appear at once, or a toolbar
 * feels sticky. Mount it once, high up, not around each tooltip.
 */
export function TooltipProvider({
	children,
	...props
}: React.ComponentPropsWithoutRef<typeof RadixTooltip.Provider>) {
	return (
		<RadixTooltip.Provider delayDuration={500} skipDelayDuration={300} {...props}>
			{children}
		</RadixTooltip.Provider>
	);
}
