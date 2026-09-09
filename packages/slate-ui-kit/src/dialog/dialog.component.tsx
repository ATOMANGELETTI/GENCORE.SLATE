import * as RadixDialog from '@radix-ui/react-dialog';
import { CloseIcon } from '@slate/icons';

import { cn } from '../lib/cn.util.ts';
import { dialogContentVariants, dialogOverlayVariants } from './dialog.variants.ts';

/**
 * A modal dialog, centred over the window.
 *
 * Built on Radix rather than hand-rolled, for the same reason as
 * `ContextMenu`: focus trapping, restoring focus to whatever opened it, and
 * dismissing on Escape or an outside click are all easy to approximate and
 * hard to get exactly right — see `.agents/rules/05-react-and-ui.md`.
 *
 * Generic on purpose. `AboutDialog` is the one composition the suite needs
 * today; a Preferences dialog or a confirmation prompt would build on this
 * same primitive rather than each hand-rolling an overlay.
 */

type DialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Read by assistive technology; not necessarily shown. Pair with a
	 *  visible heading inside `children` when one exists. */
	title: string;
	children: React.ReactNode;
	className?: string;
};

export function Dialog({ open, onOpenChange, title, children, className }: DialogProps) {
	return (
		<RadixDialog.Root open={open} onOpenChange={onOpenChange}>
			<RadixDialog.Portal>
				<RadixDialog.Overlay className={dialogOverlayVariants()} />

				<RadixDialog.Content
					aria-describedby={undefined}
					className={cn(dialogContentVariants(), className)}
				>
					<RadixDialog.Title className="sr-only">{title}</RadixDialog.Title>

					{children}

					<RadixDialog.Close
						aria-label="Close"
						className={cn(
							'absolute top-3 right-3 flex size-6 items-center justify-center rounded-full',
							'text-tertiary transition-colors duration-[var(--slate-duration-fast)]',
							'hover:bg-hover hover:text-primary',
							'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus',
						)}
					>
						<CloseIcon aria-hidden="true" className="size-4" />
					</RadixDialog.Close>
				</RadixDialog.Content>
			</RadixDialog.Portal>
		</RadixDialog.Root>
	);
}
