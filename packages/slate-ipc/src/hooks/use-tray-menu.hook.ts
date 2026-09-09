import { getCurrentWindow } from '@tauri-apps/api/window';
import { useCallback, useEffect, useRef, useState } from 'react';

import { invoke, isDesktop } from '../invoke/command.service.ts';

/** What the tray popup needs to drive itself. */
export type TrayMenu = {
	/**
	 * Attach to the menu's outermost element. The window is sized from what
	 * this measures, because Rust cannot see how tall the menu turned out.
	 */
	surfaceRef: React.RefObject<HTMLDivElement | null>;
	/** Whether the main window is currently on screen. */
	isMainWindowVisible: boolean;
	showMainWindow: () => void;
	hideMainWindow: () => void;
	/** Reveals this app's config file — see `content.context-menu.ts` for why
	 *  Preferences means this rather than opening a settings window. */
	openPreferences: () => void;
	quit: () => void;
	dismiss: () => void;
};

/**
 * Drives the tray menu window.
 *
 * The menu is a window rather than a native menu (ADR 0012), which means three
 * things a native menu would have done for itself have to happen here: it
 * measures its own content so the window can be sized to it, it re-reads
 * whether the main window is visible each time it opens, and it closes itself
 * on Escape.
 */
export function useTrayMenu(): TrayMenu {
	const surfaceRef = useRef<HTMLDivElement>(null);
	const [isMainWindowVisible, setIsMainWindowVisible] = useState(true);

	const dismiss = useCallback(() => {
		void invoke('slate_tray_menu_dismiss').catch(() => {});
	}, []);

	// Report the size the menu actually needs, and keep reporting it if the
	// content changes — an application may contribute items conditionally.
	useEffect(() => {
		const surface = surfaceRef.current;
		if (!isDesktop() || !surface) {
			return;
		}

		const report = () => {
			const { width, height } = surface.getBoundingClientRect();
			if (width > 0 && height > 0) {
				void invoke('slate_tray_menu_ready', {
					width: Math.ceil(width),
					height: Math.ceil(height),
				}).catch(() => {});
			}
		};

		report();

		const observer = new ResizeObserver(report);
		observer.observe(surface);

		return () => observer.disconnect();
	}, []);

	// The window is reused rather than rebuilt for each click, so state from
	// the previous opening is still on screen. Re-read it every time it shows.
	useEffect(() => {
		if (!isDesktop()) {
			return;
		}

		let isActive = true;
		let unlisten: (() => void) | undefined;

		const refresh = () => {
			void invoke('slate_tray_main_window_is_visible')
				.then((visible) => {
					if (isActive) {
						setIsMainWindowVisible(visible);
					}
				})
				.catch(() => {});
		};

		const subscribe = async () => {
			// Focus is what the tray gives the popup when it shows it, so this
			// is the moment the menu becomes visible to the user.
			unlisten = await getCurrentWindow().onFocusChanged(({ payload }) => {
				if (payload) {
					refresh();
				}
			});
		};

		refresh();
		void subscribe();

		return () => {
			isActive = false;
			// Dropping an unlisten function leaks the listener for the lifetime
			// of the window — see .agents/rules/05-react-and-ui.md.
			unlisten?.();
		};
	}, []);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				dismiss();
			}
		};

		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [dismiss]);

	return {
		surfaceRef,
		isMainWindowVisible,
		showMainWindow: useCallback(() => {
			void invoke('slate_tray_show_main_window').catch(() => {});
		}, []),
		hideMainWindow: useCallback(() => {
			void invoke('slate_tray_hide_main_window').catch(() => {});
		}, []),
		openPreferences: useCallback(() => {
			void invoke('slate_open_config_file').catch(() => {});
		}, []),
		quit: useCallback(() => {
			void invoke('slate_tray_quit').catch(() => {});
		}, []),
		dismiss,
	};
}
