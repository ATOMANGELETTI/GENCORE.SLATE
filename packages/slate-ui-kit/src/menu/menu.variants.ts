import { cva, type VariantProps } from 'class-variance-authority';

/**
 * The menu's visual language, in one place.
 *
 * Three surfaces use it — the title-bar context menu, the content context
 * menu, and the tray popup — and they have to be indistinguishable from one
 * another, so none of this is allowed to live in a component body.
 *
 * Nothing here refers to a Radix custom property: the tray popup is a window
 * that renders the same surface without Radix anywhere in the tree. The
 * Radix-specific positioning and animation hooks live on `ContextMenu`.
 */

export const menuSurfaceVariants = cva([
	'flex flex-col',
	'min-w-[var(--slate-chrome-menuMinWidth)] p-[var(--slate-chrome-menuPadding)]',
	'rounded-[var(--slate-chrome-menuRadius)]',
	// The fill sits one step above the canvas; the hairline and the shadow are
	// what lift it, rather than a brighter surface. That is what stops a menu
	// glowing against Polar Night.
	'bg-menu text-primary',
	'border border-hairline shadow-overlay',
]);

export const menuItemVariants = cva(
	[
		'group/item relative flex select-none items-center gap-2',
		'h-[var(--slate-chrome-menuItemHeight)] shrink-0 px-2',
		'rounded-sm text-base outline-none',
		'transition-colors duration-[var(--slate-duration-instant)]',
		// Radix drives the highlight through `data-highlighted` for pointer and
		// keyboard alike, so hovering an item and arrowing to it look identical.
		// The tray popup sets the same attribute by hand for the same reason.
		'data-[highlighted]:bg-hover',
		'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
		'[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
	],
	{
		variants: {
			tone: {
				default: 'text-primary [&_svg]:text-secondary',
				// Anything that discards work or ends the process. The word carries
				// the meaning; the colour only reinforces it, which is what keeps
				// this usable without colour vision.
				danger: 'text-status-danger [&_svg]:text-status-danger',
			},
		},
		defaultVariants: { tone: 'default' },
	},
);

export type MenuItemVariants = VariantProps<typeof menuItemVariants>;
