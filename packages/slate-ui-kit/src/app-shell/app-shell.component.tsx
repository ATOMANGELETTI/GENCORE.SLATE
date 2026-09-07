import { cn } from '../lib/cn.util.ts';
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
	status,
	children,
	className,
}: AppShellProps) {
	return (
		<div
			data-focused={isFocused}
			className={cn(
				'flex h-full w-full flex-col overflow-hidden bg-canvas text-primary',
				// Rounded corners with a hairline ring: the window itself is
				// transparent and undecorated, so the frame is drawn here.
				'rounded-[var(--slate-chrome-windowRadius)] ring-1 ring-inset ring-hairline',
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
