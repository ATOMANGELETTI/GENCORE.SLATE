import { cva, type VariantProps } from 'class-variance-authority';

/**
 * The uppercase label that names a group of rows.
 *
 * Uppercase is the suite's house style for structural labelling, and uppercase
 * without tracking is the mistake this exists to prevent: capitals destroy the
 * word shape a reader normally recognises, so the letters have to be separated
 * far enough to be read individually. `tracking-widest` is not decoration here,
 * it is what makes 10px capitals legible at all.
 *
 * Two tones, for the two jobs the label does. `plain` floats in the padding of
 * a scrolling list, where the space around it is the separation. `banded` sits
 * on an inset strip and is used where a group boundary has to survive being
 * scrolled past — the strip reads as a region marker rather than as a heading.
 */
export const sectionLabelVariants = cva(
	['select-none text-2xs uppercase tracking-widest text-tertiary'],
	{
		variants: {
			tone: {
				plain: 'px-2 pt-[var(--slate-density-sectionGap)] pb-2',
				banded: 'flex h-6 shrink-0 items-center bg-inset px-4',
			},
		},
		defaultVariants: { tone: 'plain' },
	},
);

export type SectionLabelVariants = VariantProps<typeof sectionLabelVariants>;
