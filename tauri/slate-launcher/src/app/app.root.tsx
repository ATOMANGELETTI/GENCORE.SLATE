import { CloseIcon, LayoutIcon, RefreshIcon, UpdateAvailableIcon } from '@slate/icons';
import {
	invoke,
	invokeAppCommand,
	isDesktop,
	useRuntimeInfo,
	useWebviewZoom,
	useWindowChrome,
} from '@slate/ipc';
import { applyAccent, applyDensity } from '@slate/tokens';
import {
	AboutDialog,
	AppShell,
	Button,
	ContextMenu,
	StatusItem,
	Tooltip,
	TooltipProvider,
} from '@slate/ui-kit';
import { useEffect, useState } from 'react';

import { countRunning, countUpdates } from '../apps/filter-apps.util.ts';
import { runCommand } from '../command/run-command.service.ts';
import { buildContentContextMenu } from '../context-menu/content.context-menu.ts';
import { buildTitlebarContextMenu } from '../context-menu/titlebar.context-menu.ts';
import { APPS } from '../data/apps.constants.ts';
import { VOLUME } from '../data/volume.constants.ts';
import { useExpandedWindow } from '../hooks/use-expanded-window.hook.ts';
import { ContentLayout } from '../layout/content.layout.tsx';
import { useLauncherStore } from '../state/launcher.store.ts';
import type { HistoryEntry } from '../views/console.view.tsx';
import { VIEWS } from '../views/views.registry.ts';

/**
 * The Launcher window.
 *
 * Two different context menus, deliberately: the title bar offers window
 * operations, the content area offers application ones. A right-click that
 * produces the same list wherever it lands is telling the user their click
 * carried no meaning. The tray offers a third, from its own window.
 *
 * This is also where the three things outside React are kept in step with the
 * store — the window's width, and the density and accent attributes on the
 * document element. All three are `useEffect` in its proper sense:
 * synchronising with something React does not own.
 */
export function AppRoot() {
	const chrome = useWindowChrome();
	const runtime = useRuntimeInfo();
	const zoom = useWebviewZoom();
	const [isAboutOpen, setIsAboutOpen] = useState(false);
	const [history, setHistory] = useState<HistoryEntry[]>([]);

	const {
		activeView,
		openView,
		closeView,
		density,
		accent,
		setQuery,
		togglePin,
		setAccent,
		setDensity,
	} = useLauncherStore();

	useExpandedWindow(activeView !== null);

	useEffect(() => {
		applyDensity(density, document.documentElement);
	}, [density]);

	useEffect(() => {
		applyAccent(accent, document.documentElement);
	}, [accent]);

	// `?` opens the same reference `/help` renders, so there is one source of
	// truth rather than a help page and a cheatsheet that drift apart. Ignored
	// while a field has focus, or it would be impossible to type a question
	// mark into the command bar.
	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== '?' || event.ctrlKey || event.metaKey || event.altKey) {
				return;
			}
			const target = event.target;
			if (target instanceof HTMLElement && target.matches('input, textarea, [contenteditable]')) {
				return;
			}

			event.preventDefault();
			openView('help');
		};

		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [openView]);

	const contentMenu = buildContentContextMenu({
		zoom,
		onOpenPreferences: () => openView('settings'),
		onShowAbout: () => setIsAboutOpen(true),
	});

	const launch = (appId: string) => {
		if (!isDesktop()) {
			return;
		}
		void invokeAppCommand('slate_launcher_launch_app', { appId }).catch(() => {});
	};

	const updates = countUpdates(APPS);
	const running = countRunning(APPS);
	const view = activeView ? VIEWS[activeView] : null;

	return (
		// One provider for the window, so moving between the rail's five
		// buttons skips the delay rather than waiting afresh at each.
		<TooltipProvider>
			<AppShell
				title={view ? view.title : 'Launcher'}
				isFocused={chrome.isFocused}
				isMaximized={chrome.isMaximized}
				onClose={chrome.close}
				onMinimize={chrome.minimize}
				onToggleMaximize={chrome.toggleMaximize}
				titleBarContextMenu={buildTitlebarContextMenu(chrome)}
				titleBarActions={
					view ? (
						<Tooltip content="Close view">
							<Button
								variant="ghost"
								size="icon"
								aria-label="Close view"
								onClick={closeView}
								data-tauri-drag-region="false"
							>
								<CloseIcon strokeWidth={1.5} aria-hidden="true" />
							</Button>
						</Tooltip>
					) : (
						<Tooltip content="Rescan applications">
							<Button
								variant="ghost"
								size="icon"
								aria-label="Rescan applications"
								data-tauri-drag-region="false"
							>
								<RefreshIcon strokeWidth={1.5} aria-hidden="true" />
							</Button>
						</Tooltip>
					)
				}
				status={{
					leading: (
						<StatusItem tone={runtime.status === 'error' ? 'warning' : 'default'}>
							{`${APPS.length} apps · ${running} running`}
						</StatusItem>
					),
					center:
						updates > 0 ? (
							<button
								type="button"
								onClick={() => openView('updates')}
								className="flex items-center gap-1.5 text-status-warning"
							>
								<UpdateAvailableIcon strokeWidth={1.5} aria-hidden="true" className="size-3.5" />
								{`${updates} updates`}
							</button>
						) : null,
					trailing: (
						// The volume is named here because a suite on a removable
						// drive can be pulled out mid-write, and this is the
						// cheapest possible place to say so.
						<StatusItem tone={VOLUME.isRemovable ? 'warning' : 'default'}>
							{VOLUME.label}
						</StatusItem>
					),
				}}
			>
				<ContextMenu label="Launcher" entries={contentMenu} className="block">
					<div className="h-full">
						<ContentLayout
							runtime={runtime.info}
							history={history}
							onLaunch={launch}
							onRunCommand={(text) => {
								setHistory((previous) => [
									...previous,
									{ id: `${previous.length}-${Date.now()}`, text },
								]);
								runCommand(text, {
									openView,
									closeView,
									setQuery,
									togglePin,
									setAccent,
									setDensity,
									launch,
									setTheme: (theme) => {
										void invoke('slate_set_theme', { theme }).catch(() => {});
									},
									revealFolder: (target) => {
										if (isDesktop()) {
											void invokeAppCommand('slate_launcher_reveal', { target }).catch(() => {});
										}
									},
									quit: () => {
										void invoke('slate_tray_quit').catch(() => {});
									},
								});
							}}
						/>
					</div>
				</ContextMenu>
			</AppShell>

			<AboutDialog
				open={isAboutOpen}
				onOpenChange={setIsAboutOpen}
				appName="Launcher"
				icon={LayoutIcon}
				description="Launches the suite's apps and third-party portable apps. Hosts the IPC broker."
				suiteVersion={runtime.info?.suiteVersion ?? null}
				copyright="Copyright (c) 2026 Dustin Angeletti. All rights reserved."
			/>
		</TooltipProvider>
	);
}
