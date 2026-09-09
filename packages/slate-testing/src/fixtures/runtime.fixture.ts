import type { RuntimeInfo, WindowState } from '@slate/bindings';

/**
 * Fixtures for anything that would otherwise need a real Tauri window.
 *
 * Both take overrides so a test states only the field it cares about — a test
 * that spells out every property hides its own point.
 */

/** Window chrome state plus no-op handlers. */
export function makeWindowChrome(overrides: Partial<WindowState> = {}) {
	return {
		isMaximized: false,
		isFocused: true,
		visibility: 'visible' as const,
		isAlwaysOnTop: false,
		...overrides,
		close: () => {},
		minimize: () => {},
		toggleMaximize: () => {},
		hide: () => {},
		show: () => {},
		setAlwaysOnTop: () => {},
	};
}

/** A plausible `RuntimeInfo` response. */
export function makeRuntimeInfo(overrides: Partial<RuntimeInfo> = {}): RuntimeInfo {
	return {
		appId: 'slate-launcher',
		suiteVersion: '0.1.0',
		protocolVersion: 1,
		installFingerprint: '0123456789abcdef',
		theme: 'dark',
		config: {
			suite: {
				theme: 'dark',
				material: 'solid',
				'use-system-accent': false,
				'reduce-motion': false,
				'log-level': 'info',
				'log-retention-days': 14,
			},
			app: {
				window: { width: 1100, height: 720, x: null, y: null, maximized: false },
				theme: null,
			},
		},
		...overrides,
	};
}
