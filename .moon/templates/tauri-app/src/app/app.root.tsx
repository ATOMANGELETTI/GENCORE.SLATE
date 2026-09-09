import { WindowIcon } from '@slate/icons';
import { invoke, useRuntimeInfo, useWebviewZoom, useWindowChrome } from '@slate/ipc';
import { AboutDialog, AppShell, ContextMenu, StatusItem } from '@slate/ui-kit';
import { useState } from 'react';

import { buildContentContextMenu } from '../context-menu/content.context-menu.ts';
import { buildTitlebarContextMenu } from '../context-menu/titlebar.context-menu.ts';
import { ContentLayout } from '../layout/content.layout.tsx';

/**
 * The {{ title }} window.
 *
 * Two different context menus, deliberately: the title bar offers window
 * operations, the content area offers application ones. A right-click that
 * produces the same list wherever it lands is telling the user their click
 * carried no meaning. A tray menu is a natural third, once this application
 * has an icon of its own to hang one from — see the Launcher's own `src/tray/`
 * for the shape that takes.
 */
export function AppRoot() {
	const chrome = useWindowChrome();
	const runtime = useRuntimeInfo();
	const zoom = useWebviewZoom();
	const [isAboutOpen, setIsAboutOpen] = useState(false);

	// Preferences has no window yet, so it reveals the config file it would
	// eventually edit instead — genuinely useful today, rather than a menu
	// item that does nothing until that window exists.
	const contentMenu = buildContentContextMenu({
		zoom,
		onOpenPreferences: () => {
			void invoke('slate_open_config_file').catch(() => {});
		},
		onShowAbout: () => setIsAboutOpen(true),
	});

	return (
		<AppShell
			title="{{ title }}"
			isFocused={chrome.isFocused}
			isMaximized={chrome.isMaximized}
			onClose={chrome.close}
			onMinimize={chrome.minimize}
			onToggleMaximize={chrome.toggleMaximize}
			titleBarContextMenu={buildTitlebarContextMenu(chrome)}
			status={{
				leading: (
					<StatusItem tone={runtime.status === 'error' ? 'warning' : 'default'}>Ready</StatusItem>
				),
				trailing: <StatusItem>{runtime.info ? `SLATE ${runtime.info.suiteVersion}` : 'SLATE'}</StatusItem>,
			}}
		>
			<ContextMenu label="{{ title }}" entries={contentMenu} className="block">
				<div className="h-full">
					<ContentLayout />
				</div>
			</ContextMenu>

			<AboutDialog
				open={isAboutOpen}
				onOpenChange={setIsAboutOpen}
				appName="{{ title }}"
				icon={WindowIcon}
				description="Part of the GENCORE.SLATE portable application suite."
				suiteVersion={runtime.info?.suiteVersion ?? null}
				copyright="Copyright (c) 2026 Dustin Angeletti. All rights reserved."
			/>
		</AppShell>
	);
}
