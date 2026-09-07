import { cn } from '../lib/cn.util.ts';
import { type ButtonVariants, buttonVariants } from './button.variants.ts';

type ButtonProps = ButtonVariants & {
	/** Required when the button has no visible text, e.g. an icon button. */
	'aria-label'?: string;
} & React.ComponentPropsWithRef<'button'>;

/**
 * The suite's button.
 *
 * `ref` is an ordinary prop in React 19, so no `forwardRef` wrapper is needed.
 * Native props are spread and `className` is merged, which is what lets a
 * caller adjust layout without the component having to anticipate it.
 */
export function Button({ variant, size, className, type = 'button', ...props }: ButtonProps) {
	return (
		<button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
	);
}
