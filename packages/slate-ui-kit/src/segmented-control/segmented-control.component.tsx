import * as ToggleGroup from '@radix-ui/react-toggle-group';
import type { SlateIcon } from '@slate/icons';

import { cn } from '../lib/cn.util.ts';

/**
 * A small set of mutually exclusive options, all visible at once — theme,
 * window material, row density.
 *
 * Chosen over a dropdown wherever the options number three or four: a select
 * hides the alternatives behind a click, and for a setting the user is
 * comparing rather than searching, showing them is the whole point.
 *
 * Radix `ToggleGroup` in single mode gives keyboard roving focus and a proper
 * radio-group announcement. What it does not give is a guarantee that something
 * stays selected — pressing the active item deselects it and reports `''` — so
 * that case is swallowed below. A settings control with nothing chosen is not a
 * state this suite has a meaning for.
 */

type SegmentedItem<TValue extends string> = {
	value: TValue;
	label: string;
	/** Optional leading glyph. Omit it where the labels are short and clear. */
	icon?: SlateIcon;
};

type SegmentedControlProps<TValue extends string> = {
	/** The accessible name for the group as a whole. */
	label: string;
	items: SegmentedItem<TValue>[];
	value: TValue;
	onValueChange: (value: TValue) => void;
	className?: string;
};

export function SegmentedControl<TValue extends string>({
	label,
	items,
	value,
	onValueChange,
	className,
}: SegmentedControlProps<TValue>) {
	return (
		<ToggleGroup.Root
			type="single"
			value={value}
			aria-label={label}
			onValueChange={(next) => {
				// Radix reports '' when the pressed item was already active.
				// Treating that as a change would let a user empty a setting by
				// clicking the option they already had.
				if (next) {
					onValueChange(next as TValue);
				}
			}}
			className={cn(
				'inline-flex shrink-0 items-center gap-0.5 rounded-md border border-hairline p-0.5',
				className,
			)}
		>
			{items.map(({ value: itemValue, label: itemLabel, icon: Icon }) => (
				<ToggleGroup.Item
					key={itemValue}
					value={itemValue}
					className={cn(
						'inline-flex h-6 items-center gap-1.5 rounded-sm px-2.5',
						'text-2xs uppercase tracking-wider text-tertiary',
						'transition-colors duration-[var(--slate-duration-fast)] ease-standard',
						'hover:text-secondary',
						'data-[state=on]:bg-elevated data-[state=on]:text-primary',
						'[&_svg]:size-3.5 [&_svg]:shrink-0',
					)}
				>
					{Icon ? <Icon strokeWidth={1.5} aria-hidden="true" /> : null}
					{itemLabel}
				</ToggleGroup.Item>
			))}
		</ToggleGroup.Root>
	);
}
