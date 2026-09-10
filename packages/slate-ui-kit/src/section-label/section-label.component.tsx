import { cn } from '../lib/cn.util.ts';
import { type SectionLabelVariants, sectionLabelVariants } from './section-label.variants.ts';

/**
 * Names a group of rows — `SUITE`, `PORTABLE APPS`, `FOLDERS`.
 *
 * Deliberately not a heading element. These label groups inside a list, and a
 * screen reader announcing "heading level 3, suite" between every two rows is
 * noise rather than structure. Give the label an `id` and point the group's
 * `aria-labelledby` at it instead, which names the group without inventing a
 * document outline the window does not have.
 */

type SectionLabelProps = SectionLabelVariants & React.ComponentPropsWithRef<'div'>;

export function SectionLabel({ tone, className, ...props }: SectionLabelProps) {
	return <div className={cn(sectionLabelVariants({ tone }), className)} {...props} />;
}
