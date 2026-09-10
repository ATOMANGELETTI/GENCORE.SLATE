import type { SlateIcon } from '@slate/icons';

import { cn } from '../lib/cn.util.ts';
import { type TextFieldVariants, textFieldVariants } from './text-field.variants.ts';

/**
 * A single-line text input.
 *
 * The wrapper carries the rule and the focus treatment; the `<input>` itself is
 * bare, so every native prop a caller passes — `type`, `value`, `onChange`,
 * `autoFocus`, `maxLength` — lands where it belongs rather than being
 * re-declared here. `className` reaches the wrapper, because that is what a
 * caller wants to place; `inputClassName` exists for the rare case of styling
 * the field itself.
 *
 * An input with no visible label needs `aria-label`, and the type does not let
 * you forget: `label` is required, and `isLabelHidden` is how you say you meant
 * it.
 */

type TextFieldProps = TextFieldVariants & {
	/** The accessible name. Also rendered visibly unless hidden. */
	label: string;
	/**
	 * Hides the label visually while keeping it for assistive technology. For a
	 * field whose purpose is already obvious from a leading glyph and a
	 * placeholder, such as a search box.
	 */
	isLabelHidden?: boolean;
	/** Leading glyph, drawn at a lighter stroke than Lucide's default. */
	icon?: SlateIcon;
	/** Right-aligned content — a clear button, a count, a shortcut hint. */
	trailing?: React.ReactNode;
	inputClassName?: string;
} & Omit<React.ComponentPropsWithRef<'input'>, 'size'>;

export function TextField({
	label,
	isLabelHidden = false,
	icon: Icon,
	trailing,
	size,
	className,
	inputClassName,
	id,
	...props
}: TextFieldProps) {
	const inputId = id ?? `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

	return (
		<div className={cn('flex w-full flex-col gap-1', className)}>
			{isLabelHidden ? null : (
				<label htmlFor={inputId} className="text-2xs uppercase tracking-widest text-tertiary">
					{label}
				</label>
			)}
			<div className={cn(textFieldVariants({ size }))}>
				{Icon ? <Icon strokeWidth={1.5} aria-hidden="true" /> : null}
				<input
					id={inputId}
					aria-label={isLabelHidden ? label : undefined}
					className={cn(
						// The wrapper draws the focus indicator, so a second ring
						// around the input itself would be one ring too many.
						'min-w-0 flex-1 bg-transparent text-primary outline-none',
						'placeholder:text-tertiary',
						inputClassName,
					)}
					{...props}
				/>
				{trailing}
			</div>
		</div>
	);
}
