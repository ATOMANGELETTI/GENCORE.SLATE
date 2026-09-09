import type { WindowState } from '@slate/bindings';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useCallback, useEffect, useState } from 'react';

import { invoke, isDesktop } from '../invoke/command.service.ts';

/** What an application needs to drive `AppShell` and its window menus. */
export type WindowChrome = WindowState & {
	/**
	 * Closes the window, which hides it to the tray rather than exiting. The
	 * backend intercepts the close for this reason; quitting is offered only
	 * from the tray menu.
	 */
	close: () => void;
	minimize: () => void;
	toggleMaximize: () => void;
	/** Hides to the tray explicitly, without going through close. */
	hide: () => void;
	/** Brings the window back from hidden or minimised. */
	show: () => void;
	/** Pins the window above other windows, or releases it. */
	setAlwaysOnTop: (isEnabled: boolean) => void;
};

const INITIAL: WindowState = {
	isMaximized: false,
	isFocused: true,
	visibility: 'visible',
	isAlwaysOnTop: false,
};

/**
 * Connects the shared chrome to the real window.
 *
 * Subscribes to focus and resize events so the traffic lights desaturate the
 * moment the window loses focus, and persists geometry on move and resize so
 * the window reopens where the user left it — which matters here because
 * custom chrome means Windows Snap Layouts are unavailable (ADR 0010).
 *
 * Outside a Tauri webview — in the UI kit gallery, for instance — it returns
 * inert handlers so the same components still render.
 */
export function useWindowChrome(): WindowChrome {
	const [state, setState] = useState<WindowState>(INITIAL);

	useEffect(() => {
		if (!isDesktop()) {
			return;
		}

		let isActive = true;
		const unlisteners: Array<() => void> = [];

		const refresh = async () => {
			try {
				const next = await invoke('slate_window_state');
				if (isActive) {
					setState(next);
				}
			} catch {
				// A window that has already closed cannot report its state.
				// There is nothing to recover here and nothing worth showing.
			}
		};

		const subscribe = async () => {
			const window = getCurrentWindow();

			unlisteners.push(
				await window.onFocusChanged(({ payload }) => {
					setState((current) => ({ ...current, isFocused: payload }));
				}),
			);

			unlisteners.push(
				await window.onResized(() => {
					void refresh();
					void invoke('slate_window_persist_geometry').catch(() => {});
				}),
			);

			unlisteners.push(
				await window.onMoved(() => {
					void invoke('slate_window_persist_geometry').catch(() => {});
				}),
			);

			await refresh();
		};

		void subscribe();

		return () => {
			isActive = false;
			// Dropping an unlisten function leaks the listener for the lifetime
			// of the window — see .agents/rules/05-react-and-ui.md.
			for (const unlisten of unlisteners) {
				unlisten();
			}
		};
	}, []);

	const close = useCallback(() => {
		void invoke('slate_window_close').catch(() => {});
	}, []);

	const minimize = useCallback(() => {
		void invoke('slate_window_minimize').catch(() => {});
	}, []);

	const toggleMaximize = useCallback(() => {
		void invoke('slate_window_toggle_maximize')
			.then((isMaximized) => setState((current) => ({ ...current, isMaximized })))
			.catch(() => {});
	}, []);

	const hide = useCallback(() => {
		void invoke('slate_window_hide')
			.then(() => setState((current) => ({ ...current, visibility: 'hidden' })))
			.catch(() => {});
	}, []);

	const show = useCallback(() => {
		void invoke('slate_window_show')
			.then(() => setState((current) => ({ ...current, visibility: 'visible' })))
			.catch(() => {});
	}, []);

	const setAlwaysOnTop = useCallback((isEnabled: boolean) => {
		void invoke('slate_window_set_always_on_top', { isEnabled })
			.then((next) => setState((current) => ({ ...current, isAlwaysOnTop: next })))
			.catch(() => {});
	}, []);

	return { ...state, close, minimize, toggleMaximize, hide, show, setAlwaysOnTop };
}
