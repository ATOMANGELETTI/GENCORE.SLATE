import { invokeAppCommand, isDesktop } from '@slate/ipc';
import { useEffect } from 'react';

/**
 * Widens the window while a view is open, and retracts it when the view closes.
 *
 * The resize is a **step, not an animation**. WebView2 cannot tween an OS
 * window smoothly — the page repaints at each intermediate size and the result
 * is visible tearing — so the window snaps to its new width and the view's own
 * entrance carries the sense of movement instead. That is a deliberate
 * limitation of the platform rather than a shortcut.
 *
 * Synchronising React state with something outside React is exactly what
 * `useEffect` is for, and this is the whole of its use here: the store owns
 * whether a view is open, and this makes the operating system agree.
 *
 * Failures are swallowed. A window that could not be resized is a cosmetic
 * problem — the view still opens, just in a narrower window — and turning it
 * into a thrown error would take down a render for something the user can
 * fix by dragging an edge.
 */
export function useExpandedWindow(isExpanded: boolean): void {
	useEffect(() => {
		// The gallery and the unit tests render these components in an ordinary
		// browser, where there is no window to resize and no command to call.
		if (!isDesktop()) {
			return;
		}

		void invokeAppCommand('slate_launcher_set_expanded', { isExpanded }).catch(() => {});
	}, [isExpanded]);
}
