import { cn } from '../lib/cn.util.ts';

/**
 * A keyboard shortcut and what it does — the strip along the foot of the
 * command bar, and the inline hints beside a field.
 *
 * # Why the keys are words
 *
 * `ENTER` and `ESC`, not `↵` and `⎋`. The suite is Windows-only, so the Mac
 * glyph vocabulary would be wrong even if it rendered — and it does not render:
 * the bundled Fira Sans subsets cover Latin and the two arrows the suite
 * actually uses, so a return or command glyph would drop to a fallback face or
 * to a replacement box. Spelling the key is also simply clearer, and it sets in
 * capitals alongside everything else in this interface.
 */

type KeyHintProps = {
	/**
	 * The keys, in the order they are pressed or offered. Multiple keys are
	 * rendered as separate caps — `['↑', '↓']` for a pair that does one job.
	 */
	keys: string[];
	/** What the keys do. Rendered in capitals beside them. */
	children: React.ReactNode;
} & React.ComponentPropsWithRef<'span'>;

export function KeyHint({ keys, children, className, ...props }: KeyHintProps) {
	return (
		<span
			className={cn(
				'inline-flex select-none items-center gap-1.5',
				'text-2xs uppercase tracking-wider text-tertiary',
				className,
			)}
			{...props}
		>
			<span className="inline-flex items-center gap-0.5">
				{keys.map((key) => (
					<kbd
						key={key}
						className={cn(
							'inline-flex h-4 min-w-4 items-center justify-center px-1',
							'rounded-sm border border-hairline',
							'font-mono text-2xs tracking-normal text-secondary',
						)}
					>
						{key}
					</kbd>
				))}
			</span>
			{children}
		</span>
	);
}
