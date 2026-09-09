import { CloseIcon, UpdateIcon } from '@slate/icons';
import { MenuSeparator } from '@slate/ui-kit';

type UpdateNoticeProps = {
	/** Returns to the ordinary menu. */
	onBack: () => void;
	/** Focuses the close control once this notice appears — see the caller. */
	closeButtonRef: React.RefObject<HTMLButtonElement | null>;
};

/**
 * What "Check for Updates" opens to, in place of an actual update channel.
 *
 * Rendered in the same window as the menu it replaces, not a separate dialog —
 * the tray popup's own "page", the way `AppShell`'s content area is a page
 * within a window rather than a window of its own. `TrayMenuRoot` is what
 * swaps this in for the menu and back.
 *
 * Its own header row echoes `MenuHeader`'s shape rather than floating a close
 * button over the content: the update glyph sits where a label would, in
 * place of a redundant "Updates" title — the icon that led here already says
 * what this is, and the item it came from is still one glance away.
 */
export function UpdateNotice({ onBack, closeButtonRef }: UpdateNoticeProps) {
	return (
		<>
			<div className="flex h-[var(--slate-chrome-menuItemHeight)] shrink-0 items-center gap-2 px-2">
				<UpdateIcon aria-hidden="true" className="size-4 shrink-0 text-secondary" />
				<span className="flex-1" />
				<button
					ref={closeButtonRef}
					type="button"
					aria-label="Back"
					onClick={onBack}
					className="flex size-6 shrink-0 items-center justify-center rounded-sm text-tertiary transition-colors duration-[var(--slate-duration-fast)] hover:bg-hover hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-border-focus"
				>
					<CloseIcon aria-hidden="true" className="size-4" />
				</button>
			</div>

			<MenuSeparator />

			<div className="flex flex-col items-center gap-2 px-4 py-5 text-center">
				<span className="text-base text-secondary">Feature coming soon</span>
			</div>
		</>
	);
}
