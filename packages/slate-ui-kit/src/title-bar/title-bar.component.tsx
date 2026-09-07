import { cn } from '../lib/cn.util.ts';
import { TrafficLights } from './traffic-lights.component.tsx';

/**
 * The suite's window chrome.
 *
 * Every application uses this one component, which is what makes three
 * separate binaries read as one product. Applications customise only the
 * `actions` slot.
 *
 * The bar is a drag region, so anything interactive placed inside it must
 * carry `data-tauri-drag-region="false"` or it will move the window instead of
 * responding to the click.
 */

type TitleBarProps = {
	/** Centred title. Keep it short — it truncates rather than wrapping. */
	title: string;
	/** Whether the window has focus, which drives the traffic-light colour. */
	isFocused: boolean;
	/** Whether the window is zoomed. */
	isMaximized?: boolean;
	onClose: () => void;
	onMinimize: () => void;
	onToggleMaximize: () => void;
	/** Optional application controls, rendered at the trailing edge. */
	actions?: React.ReactNode;
	/** Optional leading content, placed after the traffic lights. */
	leading?: React.ReactNode;
	className?: string;
};

export function TitleBar({
	title,
	isFocused,
	isMaximized = false,
	onClose,
	onMinimize,
	onToggleMaximize,
	actions,
	leading,
	className,
}: TitleBarProps) {
	return (
		/* The bar is a pointer affordance, not a control. Double-clicking to zoom
		   is platform behaviour users expect, and everything it offers is also
		   reachable from the labelled traffic lights and the title-bar context
		   menu — nothing here is keyboard-inaccessible. Giving the bar a button
		   role would announce the entire chrome as a control, which is worse. */
		// biome-ignore lint/a11y/noStaticElementInteractions: explained above
		<header
			data-tauri-drag-region
			onDoubleClick={onToggleMaximize}
			className={cn(
				'relative flex h-[var(--slate-chrome-titlebarHeight)] shrink-0 items-center justify-between',
				'border-b border-hairline bg-surface px-3',
				'select-none',
				className,
			)}
		>
			<div className="flex items-center gap-3" data-tauri-drag-region="false">
				<TrafficLights
					isFocused={isFocused}
					isMaximized={isMaximized}
					onClose={onClose}
					onMinimize={onMinimize}
					onToggleMaximize={onToggleMaximize}
				/>
				{leading}
			</div>

			{/*
			 * Absolutely centred rather than flex-centred: the title must sit in
			 * the middle of the *window*, not in the middle of the space left
			 * over by the controls, or it shifts whenever an action is added.
			 */}
			<div
				data-tauri-drag-region
				className="pointer-events-none absolute inset-x-0 flex justify-center"
			>
				<span
					className={cn(
						'max-w-[50%] truncate text-base font-semibold tracking-tight transition-colors',
						'duration-[var(--slate-duration-normal)]',
						isFocused ? 'text-secondary' : 'text-tertiary',
					)}
				>
					{title}
				</span>
			</div>

			<div className="flex items-center gap-1" data-tauri-drag-region="false">
				{actions}
			</div>
		</header>
	);
}
