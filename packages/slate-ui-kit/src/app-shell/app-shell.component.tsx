import { cn } from '../lib/cn.util.ts';
import type { MenuEntry } from '../menu/menu.types.ts';
import { StatusBar } from '../status-bar/status-bar.component.tsx';
import { TitleBar } from '../title-bar/title-bar.component.tsx';

/**
 * The frame every SLATE window is built from: title bar, content, status bar.
 *
 * Deliberately presentational — it takes window state as props rather than
 * reading it from Tauri. That keeps this package free of any desktop
 * dependency, which is what lets the whole kit render in an ordinary browser
 * for the gallery. Applications connect it to the real window with
 * `useWindowChrome` from `@slate/ipc`.
 */

type AppShellProps = {
	title: string;
	isFocused: boolean;
	isMaximized?: boolean;
	onClose: () => void;
	onMinimize: () => void;
	onToggleMaximize: () => void;
	/** Controls at the trailing edge of the title bar. */
	titleBarActions?: React.ReactNode;
	/** Content after the traffic lights. */
	titleBarLeading?: React.ReactNode;
	/** Items offered on a right-click of the title bar. */
	titleBarContextMenu?: MenuEntry[];
	status?: {
		leading?: React.ReactNode;
		center?: React.ReactNode;
		trailing?: React.ReactNode;
	};
	children: React.ReactNode;
	className?: string;
};

export function AppShell({
	title,
	isFocused,
	isMaximized,
	onClose,
	onMinimize,
	onToggleMaximize,
	titleBarActions,
	titleBarLeading,
	titleBarContextMenu,
	status,
	children,
	className,
}: AppShellProps) {
	return (
		// The suite draws its own menus everywhere it offers one — the title bar
		// and the content area each wrap themselves in a `ContextMenu`. Without
		// this, any area neither of them covers (the status bar, today) falls
		// through to the browser's own right-click menu: Back, Refresh, Save As,
		// Inspect — none of which apply to a desktop application and all of
		// which look like a bug when they appear. This is the default for the
		// whole window; a nested `ContextMenu` further down still opens its own
		// menu first, since it intercepts the event before this handler runs.
		// Suppressing a menu neither adds a control nor needs one operable by
		// keyboard, which is what the flagged rule otherwise guards against.
		// biome-ignore lint/a11y/noStaticElementInteractions: explained above
		<div
			data-focused={isFocused}
			onContextMenu={(event) => event.preventDefault()}
			className={cn(
				'flex h-full w-full flex-col overflow-hidden bg-canvas text-primary',
				// The corner radius is a token (`--slate-chrome-windowRadius`,
				// currently 0 — see its own comment for why), not a literal, so a
				// future fix to WebView2's corner transparency is a one-line change
				// rather than a re-litigation of this component. Deliberately no
				// ring either: a hairline ring reads as a pale rim around the whole
				// window against a dark desktop, which is the opposite of flat.
				// Separation from the desktop comes from the compositor's shadow.
				'rounded-[var(--slate-chrome-windowRadius)]',
				className,
			)}
		>
			<TitleBar
				title={title}
				isFocused={isFocused}
				isMaximized={isMaximized}
				onClose={onClose}
				onMinimize={onMinimize}
				onToggleMaximize={onToggleMaximize}
				actions={titleBarActions}
				leading={titleBarLeading}
				contextMenu={titleBarContextMenu}
			/>

			{/*
			 * `min-h-0` is load-bearing: without it a flex child refuses to
			 * shrink below its content and the status bar is pushed off-screen
			 * the first time the content overflows.
			 */}
			<main className="relative min-h-0 flex-1 overflow-auto">{children}</main>

			<StatusBar leading={status?.leading} center={status?.center} trailing={status?.trailing} />
		</div>
	);
}
