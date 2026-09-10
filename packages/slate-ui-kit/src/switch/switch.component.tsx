import * as RadixSwitch from '@radix-ui/react-switch';

import { cn } from '../lib/cn.util.ts';

/**
 * An on/off control for a setting that takes effect immediately.
 *
 * Radix owns the semantics — the control is a real `role="switch"` with
 * `aria-checked`, operable by Space and Enter — and the kit owns how it looks.
 * Hand-rolling this is how a checkbox ends up announced as a button.
 *
 * Use it only where the change applies at once. A switch that needs a Save
 * button beside it is lying about what it does; that wants a checkbox.
 */

type SwitchProps = {
	/** The accessible name. Required, because the control has no text of its own. */
	label: string;
} & React.ComponentPropsWithRef<typeof RadixSwitch.Root>;

export function Switch({ label, className, ...props }: SwitchProps) {
	return (
		<RadixSwitch.Root
			aria-label={label}
			className={cn(
				'group/switch inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5',
				'border border-hairline bg-inset',
				'transition-colors duration-[var(--slate-duration-fast)] ease-standard',
				'data-[state=checked]:border-transparent data-[state=checked]:bg-accent-default',
				'disabled:pointer-events-none disabled:opacity-40',
				className,
			)}
			{...props}
		>
			<RadixSwitch.Thumb
				className={cn(
					'block size-3.5 rounded-full bg-tertiary',
					'transition-transform duration-[var(--slate-duration-fast)] ease-standard',
					'data-[state=checked]:translate-x-4 data-[state=checked]:bg-on-accent',
				)}
			/>
		</RadixSwitch.Root>
	);
}
