import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names, letting a caller's utility override a component's.
 *
 * Without `twMerge`, `<Button className="bg-surface" />` produces two
 * conflicting background classes and the winner depends on stylesheet order.
 * With it, the caller's class wins — which is what makes every component in
 * this kit composable rather than merely configurable.
 */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}
