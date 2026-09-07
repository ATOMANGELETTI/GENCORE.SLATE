import { useRuntimeInfo, useWindowChrome } from '@slate/ipc';
import { AppShell, StatusItem } from '@slate/ui-kit';

import { ContentLayout } from '../layout/content.layout.tsx';

/**
 * The Explorer window.
 *
 * Chrome, theming, and window state all come from the shared runtime, so this
 * file contains only what is specific to Explorer — which is the point of the
 * split. When this application grows real functionality it goes inside
 * `ContentLayout`, not here.
 */
export function AppRoot() {
	const chrome = useWindowChrome();
	const runtime = useRuntimeInfo();

	return (
		<AppShell
			title="Explorer"
			isFocused={chrome.isFocused}
			isMaximized={chrome.isMaximized}
			onClose={chrome.close}
			onMinimize={chrome.minimize}
			onToggleMaximize={chrome.toggleMaximize}
			status={{
				leading: (
					<StatusItem tone={runtime.status === 'error' ? 'warning' : 'default'}>Ready</StatusItem>
				),
				trailing: (
					<StatusItem>{runtime.info ? `SLATE ${runtime.info.suiteVersion}` : 'SLATE'}</StatusItem>
				),
			}}
		>
			<ContentLayout />
		</AppShell>
	);
}
