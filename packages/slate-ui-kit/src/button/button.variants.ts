import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Button variants.
 *
 * Kept in their own file so the component body stays free of branching — a
 * component that decides its own appearance with `if` statements is a
 * component whose appearance cannot be reasoned about from outside.
 */
export const buttonVariants = cva(
	[
		'inline-flex shrink-0 items-center justify-center gap-2',
		'rounded-md font-bold whitespace-nowrap',
		'transition-[background-color,color,box-shadow,opacity]',
		'duration-[var(--slate-duration-fast)] ease-standard',
		'disabled:pointer-events-none disabled:opacity-40',
		'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus',
		'[&_svg]:pointer-events-none [&_svg]:shrink-0',
	],
	{
		variants: {
			variant: {
				primary: 'bg-accent-default text-on-accent hover:bg-accent-hover active:brightness-95',
				secondary: 'bg-elevated text-primary ring-1 ring-inset ring-hairline hover:bg-hover',
				ghost: 'bg-transparent text-secondary hover:bg-hover hover:text-primary',
				danger: 'bg-status-danger text-on-danger hover:brightness-110 active:brightness-95',
			},
			size: {
				sm: 'h-7 px-2.5 text-xs [&_svg]:size-3.5',
				md: 'h-8 px-3 text-base [&_svg]:size-4',
				lg: 'h-10 px-4 text-md [&_svg]:size-4',
				icon: 'size-8 p-0 [&_svg]:size-4',
			},
		},
		defaultVariants: {
			variant: 'secondary',
			size: 'md',
		},
	},
);

/** The variant props a `Button` accepts. */
export type ButtonVariants = VariantProps<typeof buttonVariants>;
