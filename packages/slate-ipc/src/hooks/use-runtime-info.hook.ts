import type { RuntimeInfo, ThemeMode } from '@slate/bindings';
import { applyTheme } from '@slate/tokens';
import { useEffect, useState } from 'react';

import { invoke, isDesktop } from '../invoke/command.service.ts';

/** What `useRuntimeInfo` reports while it is still loading. */
export type RuntimeInfoState =
	| { status: 'loading'; info: null; error: null }
	| { status: 'ready'; info: RuntimeInfo; error: null }
	| { status: 'error'; info: null; error: string };

/**
 * Loads the runtime description and applies the configured theme.
 *
 * The theme is applied here, on the first response, rather than being left to
 * a component further down: the document must be themed before content paints
 * or the window flashes light before turning dark.
 *
 * Outside a Tauri webview it reports an error rather than hanging, so the
 * gallery and any browser preview degrade visibly instead of silently.
 */
export function useRuntimeInfo(): RuntimeInfoState {
	const [state, setState] = useState<RuntimeInfoState>({
		status: 'loading',
		info: null,
		error: null,
	});

	useEffect(() => {
		if (!isDesktop()) {
			setState({ status: 'error', info: null, error: 'not running in a desktop window' });
			return;
		}

		let isActive = true;

		void invoke('slate_runtime_info')
			.then((info) => {
				if (!isActive) {
					return;
				}
				applyTheme(info.theme, document.documentElement);
				setState({ status: 'ready', info, error: null });
			})
			.catch((error: { message?: string }) => {
				if (isActive) {
					setState({
						status: 'error',
						info: null,
						error: error.message ?? 'the runtime could not be described',
					});
				}
			});

		return () => {
			isActive = false;
		};
	}, []);

	return state;
}

/**
 * Changes the application's theme and persists it.
 *
 * Applies the change to the document immediately rather than waiting for the
 * backend to confirm — the write is to a local file and cannot meaningfully
 * fail, and a themed window that lags behind the click feels broken.
 */
export async function setTheme(theme: ThemeMode): Promise<void> {
	applyTheme(theme, document.documentElement);
	await invoke('slate_set_theme', { theme });
}
