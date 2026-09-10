import { cva, type VariantProps } from 'class-variance-authority';

/**
 * A field drawn as a ruled line rather than a box.
 *
 * A boxed input inside a window that is already made of hairline-separated
 * regions adds a second, competing border for no information — the line under
 * the text is enough to say "type here", and it is what keeps a dense settings
 * view from turning into a grid of rectangles.
 *
 * The focus treatment is the reason this is a wrapper rather than a bare
 * `<input>`. The line thickens and takes the accent on `focus-within`, which is
 * a visible focus indicator built from `border-focus` — the same token the base
 * layer's outline uses. The input's own outline is suppressed only because it
 * would draw a second ring around a control that already has one.
 */
export const textFieldVariants = cva(
	[
		'flex w-full items-center gap-2 px-1',
		'border-b border-hairline bg-transparent',
		'transition-colors duration-[var(--slate-duration-fast)] ease-standard',
		'focus-within:border-focus',
		'has-[input:disabled]:opacity-40',
		'[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-tertiary',
	],
	{
		variants: {
			size: {
				sm: 'h-8 text-sm',
				md: 'h-10 text-base',
			},
		},
		defaultVariants: { size: 'md' },
	},
);

export type TextFieldVariants = VariantProps<typeof textFieldVariants>;
