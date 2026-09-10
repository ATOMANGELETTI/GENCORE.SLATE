import { cn } from '../lib/cn.util.ts';

/**
 * A thin bar for a bounded quantity — storage used against storage free.
 *
 * Not a progress bar: nothing here is in progress. `role="meter"` is the one
 * that means "a measurement within a known range", and it is what makes a
 * screen reader announce "3 percent" rather than "loading".
 *
 * # Why this is not a native `<meter>`
 *
 * It should be, and it was — the native element carries these semantics for
 * free. It came back out because Chromium will not let the value fill be
 * restyled. With `appearance: none`, `::-webkit-meter-bar` takes a background
 * correctly, but `::-webkit-meter-optimum-value` ignores one even at
 * `!important`; the fill is painted from `::-webkit-meter-inner-element`
 * instead, which is undocumented and has changed between Chromium versions.
 * The visible result was the browser's default green in a Nord window.
 *
 * Every window in the suite is WebView2, so that is not one engine's quirk to
 * work around — it is the only engine there is. A component whose colour
 * depends on undocumented pseudo-element behaviour is not something a design
 * system can promise, so the semantics are declared explicitly on an element
 * whose paint is ours.
 *
 * Three pixels tall and hairline-tracked, because the number beside it is the
 * information and the bar is only the shape of it. A thicker bar would make a
 * quantity nobody asked about the loudest thing in the rail.
 */

type MeterProps = {
	/** The current measurement, clamped into range before it is drawn. */
	value: number;
	/** The top of the range. */
	max: number;
	/** The accessible name — what is being measured. */
	label: string;
	/** Optional caption under the bar, usually the value written out. */
	hint?: React.ReactNode;
	/**
	 * A human reading of the value, for assistive technology. Without it a
	 * screen reader announces the raw number, which is meaningless when the
	 * range is in bytes.
	 */
	valueText?: string;
} & Omit<React.ComponentPropsWithRef<'div'>, 'children'>;

export function Meter({ value, max, label, hint, valueText, className, ...props }: MeterProps) {
	// Clamped rather than trusted. The value usually arrives from a filesystem
	// reading, and a bar that renders 140% wide because a disk reported oddly
	// looks like a rendering fault rather than a surprising measurement.
	const safeMax = max > 0 ? max : 1;
	const clamped = Math.min(Math.max(value, 0), safeMax);

	const percent = (clamped / safeMax) * 100;

	return (
		<div className={cn('flex w-full flex-col gap-2', className)} {...props}>
			{/* biome-ignore lint/a11y/useSemanticElements: the native <meter> is
			    the right element and cannot be used — see the note above this
			    component for the Chromium behaviour that rules it out. */}
			<div
				role="meter"
				aria-label={label}
				aria-valuenow={clamped}
				aria-valuemin={0}
				aria-valuemax={safeMax}
				aria-valuetext={valueText}
				className="h-[3px] w-full overflow-hidden bg-inset"
			>
				{/*
				 * The floor is a class rather than a `max()` in the width, so the
				 * inline style stays a plain percentage. 570KB of a 16GB volume
				 * is 0.003%, which rounds to no pixels — and a bar showing
				 * nothing for "a little" is indistinguishable from one showing
				 * nothing for "none", which is the distinction it exists to
				 * make. Applied only when there is something to show, or an
				 * empty measurement would draw a mark too.
				 */}
				<div
					className={cn(
						'h-full bg-accent-default',
						'transition-[width] duration-[var(--slate-duration-normal)] ease-standard',
						clamped > 0 && 'min-w-[2px]',
					)}
					style={{ width: `${percent}%` }}
				/>
			</div>
			{hint ? <div className="font-mono text-2xs text-tertiary">{hint}</div> : null}
		</div>
	);
}
