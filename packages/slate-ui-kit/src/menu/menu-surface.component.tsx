import { cn } from '../lib/cn.util.ts';
import { menuSurfaceVariants } from './menu.variants.ts';

/**
 * The floating panel a menu is drawn on.
 *
 * Presentational and unaware of how it was opened, so the same surface serves
 * a right-click context menu and the tray popup — which is a whole window
 * rather than a layer inside one.
 *
 * The tray popup is the reason this suppresses its own right-click: it is not
 * behind Radix's `ContextMenu` (there is no trigger — the window *is* the
 * menu), so without this, right-clicking it falls through to the browser's
 * own menu. A caller can still supply its own `onContextMenu` through
 * `...props`, which — because it is spread after the default below — wins.
 */

type MenuSurfaceProps = {
	children: React.ReactNode;
} & React.ComponentPropsWithRef<'div'>;

export function MenuSurface({ children, className, ...props }: MenuSurfaceProps) {
	return (
		// Suppressing the tray popup's own right-click menu neither adds a
		// control nor needs one operable by keyboard, which is what the flagged
		// rule otherwise guards against — see the doc comment above.
		// biome-ignore lint/a11y/noStaticElementInteractions: explained above
		<div
			onContextMenu={(event) => event.preventDefault()}
			className={cn(menuSurfaceVariants(), className)}
			{...props}
		>
			{children}
		</div>
	);
}
