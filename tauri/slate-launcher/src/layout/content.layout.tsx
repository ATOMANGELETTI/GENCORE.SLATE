import type { RuntimeInfo, ThemeMode } from '@slate/bindings';
import { invoke, invokeAppCommand, isDesktop } from '@slate/ipc';
import { useMemo } from 'react';

import { AppList } from '../apps/app-list.component.tsx';
import { filterApps, flattenSections, groupApps } from '../apps/filter-apps.util.ts';
import type { Suggestion } from '../command/command.types.ts';
import { CommandBar } from '../command/command-bar.component.tsx';
import { CommandHints } from '../command/command-hints.component.tsx';
import { CommandResults } from '../command/command-results.component.tsx';
import { COMMAND_SPECS, findCommand } from '../command/commands.registry.ts';
import { evaluateExpression } from '../command/evaluate-expression.util.ts';
import { isCommand, parseCommand } from '../command/parse-command.util.ts';
import { ghostCompletion, predictCommands } from '../command/predict-command.util.ts';
import { APPS } from '../data/apps.constants.ts';
import { SuiteRail } from '../rail/suite-rail.component.tsx';
import { useLauncherStore } from '../state/launcher.store.ts';
import { AboutView } from '../views/about.view.tsx';
import { AddAppView } from '../views/add-app.view.tsx';
import { ConsoleView, type HistoryEntry } from '../views/console.view.tsx';
import { HelpView } from '../views/help.view.tsx';
import { SettingsView } from '../views/settings.view.tsx';
import { StorageView } from '../views/storage.view.tsx';
import { UpdatesView } from '../views/updates.view.tsx';
import { ViewFrame } from '../views/view-frame.component.tsx';
import { VIEWS } from '../views/views.registry.ts';

/**
 * The Launcher's body.
 *
 * Two states, not two layouts. At rest it is the Bureau arrangement — the
 * application list on the left, the identity and folders rail on the right,
 * with the command bar across the top of both. When a view opens, the list and
 * the rail unmount and the view stands where they were in a window that has
 * grown by `--slate-chrome-windowExpansion`.
 *
 * The command bar survives the switch. A view is somewhere you are, not
 * something you are trapped in, and being able to type `/run --terminal` from
 * inside Settings is the difference between the two.
 */

type ContentLayoutProps = {
	runtime: RuntimeInfo | null;
	/** Commands run this session, for the console's history. */
	history: HistoryEntry[];
	onRunCommand: (text: string) => void;
	onLaunch: (appId: string) => void;
};

export function ContentLayout({ runtime, history, onRunCommand, onLaunch }: ContentLayoutProps) {
	const {
		activeView,
		query,
		selectedIndex,
		pinnedIds,
		density,
		accent,
		openView,
		closeView,
		setQuery,
		clearQuery,
		moveSelection,
		selectIndex,
		setDensity,
		setAccent,
	} = useLauncherStore();

	const isCommandMode = isCommand(query);
	const parsed = useMemo(() => parseCommand(query), [query]);
	const spec = isCommandMode ? findCommand(parsed.name) : undefined;

	// Suggestions and the answer are derived during render rather than held in
	// state. They are a pure function of the query, and storing them would be a
	// second copy of something the query already determines.
	const suggestions: Suggestion[] = useMemo(
		() => (isCommandMode ? predictCommands(parsed, COMMAND_SPECS, {}, Date.now()) : []),
		[isCommandMode, parsed],
	);

	const answer = useMemo(() => {
		if (isCommandMode) {
			return null;
		}
		const evaluated = evaluateExpression(query);
		return evaluated ? { label: query.trim(), detail: evaluated.text } : null;
	}, [isCommandMode, query]);

	const sections = useMemo(() => groupApps(filterApps(APPS, query), pinnedIds), [query, pinnedIds]);
	const visibleApps = useMemo(() => flattenSections(sections), [sections]);

	const rowCount = isCommandMode ? suggestions.length : visibleApps.length;
	const ghost = isCommandMode ? ghostCompletion(query, suggestions) : '';

	const runSelected = () => {
		if (isCommandMode) {
			const suggestion = suggestions[selectedIndex];
			if (suggestion) {
				onRunCommand(suggestion.completion.trim());
			}
			return;
		}

		const app = visibleApps[selectedIndex];
		if (app) {
			onLaunch(app.id);
		}
	};

	const openFolder = (folderId: string) => {
		if (!isDesktop()) {
			return;
		}
		void invokeAppCommand('slate_launcher_reveal', { target: folderId }).catch(() => {});
	};

	const changeTheme = (theme: ThemeMode) => {
		void invoke('slate_set_theme', { theme }).catch(() => {});
	};

	const view = activeView ? VIEWS[activeView] : null;

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="shrink-0 border-b border-hairline">
				<CommandBar
					query={query}
					ghost={ghost}
					trailing={
						isCommandMode ? null : (
							<span className="font-mono text-xs text-tertiary">
								{visibleApps.length}/{APPS.length}
							</span>
						)
					}
					onQueryChange={setQuery}
					onAccept={() => {
						const suggestion = suggestions[selectedIndex] ?? suggestions[0];
						if (suggestion) {
							setQuery(suggestion.completion);
						}
					}}
					onRun={runSelected}
					onMove={(delta) => moveSelection(delta, rowCount)}
					onDismiss={() => {
						// Escape steps back one level at a time: out of command
						// mode first, then out of an open view. Closing both at
						// once would make one key do two things at different
						// moments, which is how a shortcut becomes unusable.
						if (query.length > 0) {
							clearQuery();
						} else if (activeView) {
							closeView();
						}
					}}
				/>
				{isCommandMode ? <CommandHints spec={spec} parsed={parsed} /> : null}
			</div>

			<div className="flex min-h-0 flex-1">
				{view ? (
					<ViewFrame view={view} activeView={view.id} onOpenView={openView}>
						{(sectionId) => {
							switch (view.id) {
								case 'storage':
									return <StorageView sectionId={sectionId} onOpenFolder={openFolder} />;
								case 'add':
									return <AddAppView sectionId={sectionId} />;
								case 'console':
									return <ConsoleView sectionId={sectionId} history={history} />;
								case 'settings':
									return (
										<SettingsView
											sectionId={sectionId}
											theme={runtime?.theme ?? 'dark'}
											accent={accent}
											density={density}
											onThemeChange={changeTheme}
											onAccentChange={setAccent}
											onDensityChange={setDensity}
										/>
									);
								case 'about':
									return <AboutView sectionId={sectionId} runtime={runtime} />;
								case 'help':
									return <HelpView />;
								case 'updates':
									return <UpdatesView apps={APPS} />;
								default:
									return null;
							}
						}}
					</ViewFrame>
				) : (
					<>
						<div className="flex min-w-0 flex-1 flex-col border-r border-hairline">
							{isCommandMode || answer ? (
								<CommandResults
									suggestions={suggestions}
									answer={answer}
									selectedIndex={selectedIndex}
									onSelect={selectIndex}
									onRun={(index) => {
										const suggestion = suggestions[index];
										if (suggestion) {
											onRunCommand(suggestion.completion.trim());
										}
									}}
								/>
							) : (
								<AppList
									sections={sections}
									selectedIndex={selectedIndex}
									onSelect={selectIndex}
									onLaunch={onLaunch}
								/>
							)}
						</div>

						<SuiteRail
							suiteVersion={runtime?.suiteVersion ?? null}
							activeView={activeView}
							onOpenView={openView}
							onOpenFolder={openFolder}
						/>
					</>
				)}
			</div>
		</div>
	);
}
