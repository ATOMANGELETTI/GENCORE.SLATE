import { getCurrentWebview } from '@tauri-apps/api/webview';
import { useCallback, useState } from 'react';

import { isDesktop } from '../invoke/command.service.ts';

/** Zoom control for the content context menu. */
export type WebviewZoom = {
	/** The current factor, where 1 is unscaled. */
	factor: number;
	zoomIn: () => void;
	zoomOut: () => void;
	reset: () => void;
	/** Whether another step in that direction is available. */
	canZoomIn: boolean;
	canZoomOut: boolean;
};

/**
 * The steps the menu moves through.
 *
 * A fixed ladder rather than a multiplier: repeated multiplication drifts to
 * values like 1.7280000000000002, which then shows up in a zoom indicator and
 * never returns cleanly to 1.
 */
const STEPS = [0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2] as const;

/** The index of the unscaled step, which "Reset Zoom" returns to. */
const DEFAULT_INDEX = STEPS.indexOf(1);

/**
 * Drives the webview's zoom.
 *
 * Zoom is a property of the webview rather than of the document, so this
 * cannot be a CSS transform: scaling the DOM would scale the window chrome
 * along with the content and leave the title bar the wrong height.
 *
 * Outside a Tauri webview — the UI kit gallery, for instance — the handlers
 * are inert, so a component using them still renders.
 */
export function useWebviewZoom(): WebviewZoom {
	const [index, setIndex] = useState(DEFAULT_INDEX);

	const apply = useCallback((next: number) => {
		const clamped = Math.min(Math.max(next, 0), STEPS.length - 1);
		setIndex(clamped);

		if (!isDesktop()) {
			return;
		}

		// A rejected zoom leaves the factor unchanged and is not worth
		// interrupting the user over; the menu item simply appears not to work.
		void getCurrentWebview()
			.setZoom(STEPS[clamped] ?? 1)
			.catch(() => {});
	}, []);

	return {
		factor: STEPS[index] ?? 1,
		zoomIn: useCallback(() => apply(index + 1), [apply, index]),
		zoomOut: useCallback(() => apply(index - 1), [apply, index]),
		reset: useCallback(() => apply(DEFAULT_INDEX), [apply]),
		canZoomIn: index < STEPS.length - 1,
		canZoomOut: index > 0,
	};
}
