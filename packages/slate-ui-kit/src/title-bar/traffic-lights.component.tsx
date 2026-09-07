import { cn } from '../lib/cn.util.ts';

/**
 * The three window controls, top-left, macOS style (ADR 0010).
 *
 * The details that make this read as deliberate rather than approximate:
 *
 * - Colour only while the window is focused; grey otherwise.
 * - Glyphs appear when the *group* is hovered, not the individual button, so
 *   all three reveal together exactly as they do on macOS.
 * - Order is close, minimise, zoom — left to right.
 */

type TrafficLightsProps = {
	/** Whether the window currently has focus. */
	isFocused: boolean;
	/** Whether the window is currently zoomed, for the accessible label. */
	isMaximized?: boolean;
	onClose: () => void;
	onMinimize: () => void;
	onToggleMaximize: () => void;
	className?: string;
};

type LightProps = {
	label: string;
	color: string;
	isFocused: boolean;
	onClick: () => void;
	children: React.ReactNode;
};

function Light({ label, color, isFocused, onClick, children }: LightProps) {
	return (
		<button
			type="button"
			aria-label={label}
			title={label}
			onClick={onClick}
			className={cn(
				'group/light relative flex size-[var(--slate-chrome-trafficLightSize)] items-center justify-center',
				'rounded-full transition-colors duration-[var(--slate-duration-fast)]',
				'focus-visible:outline-2 focus-visible:outline-offset-2',
				'active:brightness-90',
			)}
			style={{ backgroundColor: isFocused ? color : 'var(--slate-chrome-inactive)' }}
		>
			<svg
				viewBox="0 0 12 12"
				aria-hidden="true"
				className={cn(
					'size-[8px] opacity-0 transition-opacity duration-[var(--slate-duration-fast)]',
					'group-hover/lights:opacity-100',
				)}
				stroke="var(--slate-chrome-glyph)"
				strokeWidth="1.4"
				strokeLinecap="round"
				fill="none"
			>
				{children}
			</svg>
		</button>
	);
}

export function TrafficLights({
	isFocused,
	isMaximized = false,
	onClose,
	onMinimize,
	onToggleMaximize,
	className,
}: TrafficLightsProps) {
	return (
		<div
			// Not a drag region: clicks here must reach the buttons.
			className={cn(
				'group/lights flex items-center gap-[var(--slate-chrome-trafficLightGap)]',
				className,
			)}
		>
			<Light
				label="Close window"
				color="var(--slate-chrome-close)"
				isFocused={isFocused}
				onClick={onClose}
			>
				<path d="M3.5 3.5 8.5 8.5M8.5 3.5 3.5 8.5" />
			</Light>

			<Light
				label="Minimise window"
				color="var(--slate-chrome-minimize)"
				isFocused={isFocused}
				onClick={onMinimize}
			>
				<path d="M3 6h6" />
			</Light>

			<Light
				label={isMaximized ? 'Restore window' : 'Zoom window'}
				color="var(--slate-chrome-zoom)"
				isFocused={isFocused}
				onClick={onToggleMaximize}
			>
				<path d="M3.6 3.6h4.8v4.8z" fill="var(--slate-chrome-glyph)" stroke="none" />
			</Light>
		</div>
	);
}
