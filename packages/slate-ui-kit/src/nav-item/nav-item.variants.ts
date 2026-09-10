import { cva, type VariantProps } from 'class-variance-authority';

/**
 * The row shared by the folder list and every expanded view's own menu.
 *
 * Height comes from `--slate-density-navRow` rather than a fixed class, so the
 * row follows the user's density setting without any component knowing which
 * mode is active.
 *
 * Selection is a tinted fill and a colour change, with no border and no keyline
 * on this variant — a nav row is chosen rather than activated, and a heavier
 * marker here would compete with the accent keyline the app list uses for the
 * row that will actually launch on Enter.
 */
export const navItemVariants = cva(
	[
		'group/nav flex w-full shrink-0 items-center gap-3',
		'h-[var(--slate-density-navRow)] rounded-md px-2',
		'text-left text-sm',
		'transition-colors duration-[var(--slate-duration-fast)] ease-standard',
		'disabled:pointer-events-none disabled:opacity-40',
		'[&_svg]:size-4 [&_svg]:shrink-0',
	],
	{
		variants: {
			isSelected: {
				true: 'bg-selected text-primary [&_svg]:text-accent-default',
				false: 'text-secondary hover:bg-hover hover:text-primary [&_svg]:text-tertiary',
			},
			/**
			 * Uppercase is the house style for the Launcher's own lists. It is a
			 * variant rather than the default because the same row is reused
			 * inside views for settings sections, where a sentence-case label
			 * next to a sentence-case description reads better than shouting.
			 *
			 * Applied to the **label only**, through the `group-data` hook the
			 * component sets — never to the row. A row-wide `uppercase` also
			 * catches the trailing slot, and a trailing slot usually holds a
			 * value: a path rendered `STORAGE/DESKTOP` is not the path, and a
			 * version rendered in capitals is a version nobody can search for.
			 */
			isUppercase: {
				true: '[&_[data-nav-label]]:uppercase [&_[data-nav-label]]:tracking-wide',
				false: '',
			},
		},
		defaultVariants: { isSelected: false, isUppercase: false },
	},
);

export type NavItemVariants = VariantProps<typeof navItemVariants>;
