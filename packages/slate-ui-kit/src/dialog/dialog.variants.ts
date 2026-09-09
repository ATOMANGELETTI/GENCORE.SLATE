import { cva } from 'class-variance-authority';

/**
 * The dialog's visual language.
 *
 * Deliberately close kin to `menuSurfaceVariants`: a hairline border, the same
 * overlay shadow, the same corner family. A dialog that looked like a
 * different component from the menus would read as a browser default that
 * slipped through, which is exactly what "beautiful and professional" rules
 * out.
 */

export const dialogOverlayVariants = cva([
	'fixed inset-0 z-[var(--slate-layer-overlay)]',
	'bg-overlay',
	'data-[state=open]:animate-[slate-menu-in_var(--slate-duration-slow)_var(--slate-ease-out)]',
]);

export const dialogContentVariants = cva([
	'fixed top-1/2 left-1/2 z-[var(--slate-layer-modal)] -translate-x-1/2 -translate-y-1/2',
	'flex w-[320px] flex-col items-center gap-4',
	'rounded-[var(--slate-chrome-menuRadius)] p-6',
	'bg-menu text-primary',
	'border border-hairline shadow-overlay',
	'outline-none',
	'data-[state=open]:animate-[slate-menu-in_var(--slate-duration-slow)_var(--slate-ease-out)]',
]);
