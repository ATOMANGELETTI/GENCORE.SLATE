import type { WindowState } from '@slate/bindings';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useCallback, useEffect, useState } from 'react';

import { invoke, isDesktop } from '../invoke/command.service.ts';

/** What an application needs to drive `AppShell`. */
export type WindowChrome = WindowState & {
	close: () => void;
	minimize: () => void;
	toggleMaximize: () => void;
};

const INITIAL: WindowState = { isMaximized: false, isFocused: true, isMinimized: false };

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

	return { ...state, close, minimize, toggleMaximize };
}
