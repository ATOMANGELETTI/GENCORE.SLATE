import { LayoutIcon } from '@slate/icons';
import { invokeAppCommand, useRuntimeInfo, useTrayMenu } from '@slate/ipc';
import {
	isSeparator,
	type MenuEntry,
	MenuHeader,
	MenuItem,
	MenuSeparator,
	MenuSurface,
} from '@slate/ui-kit';
import { useEffect, useRef, useState } from 'react';

import { buildTrayMenu } from './tray.menu.ts';
import { UpdateNotice } from './update-notice.component.tsx';

/**
 * Starts a sibling application.
 *
 * Launcher-only, so this goes through `@slate/ipc`'s `invokeAppCommand`
 * rather than the shared, typed `invoke` — that one's contract is the
 * commands every application shares, and only the Launcher ever starts
 * another one.
 *
 * Fails silently, matching every other tray action here: none of them has
 * anywhere to show an error yet, and a launch that is already running or
 * whose executable is missing is not this menu's problem to solve.
 */
function launchApp(appId: 'slate-terminal' | 'slate-explorer'): void {
	void invokeAppCommand('slate_launcher_launch_app', { appId }).catch((error: unknown) => {
		console.error(error);
	});
}

/**
 * The tray menu, rendered as a whole window.
 *
 * It reuses the kit's menu surface rather than reimplementing it, which is the
 * entire justification for the menu being a window at all (ADR 0012): a native
 * Windows menu could not have looked like the rest of the suite.
 *
 * Keyboard handling is here rather than from Radix, because there is no trigger
 * and no layer — the window *is* the menu, and it is always open while visible.
 *
 * "Check for Updates" replaces the item list with a small notice in this same
 * window rather than opening anything of its own — see `UpdateNotice`. The
 * header above the list stays either way, since only the *menu* is what it
 * is standing in for.
 */
export function TrayMenuRoot() {
	const tray = useTrayMenu();
	const runtime = useRuntimeInfo();
	const [view, setView] = useState<'menu' | 'update-notice'>('menu');

	const entries = buildTrayMenu(tray, {
		openTerminal: () => launchApp('slate-terminal'),
		openExplorer: () => launchApp('slate-explorer'),
		showUpdateNotice: () => setView('update-notice'),
	}).filter((entry) => isSeparator(entry) || !entry.disabled || entry.unavailableReason);

	const selectable = entries.flatMap((entry, index) =>
		isSeparator(entry) || entry.disabled ? [] : [index],
	);
	const [activeIndex, setActiveIndex] = useState(selectable.at(0) ?? -1);
	const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());
	const backButtonRef = useRef<HTMLButtonElement>(null);

	// Focus follows the active item so a screen reader announces it, and so the
	// window has somewhere to put focus when it opens. Paused while the notice
	// is showing — its own effect below takes over instead.
	useEffect(() => {
		if (view === 'menu') {
			itemRefs.current.get(activeIndex)?.focus();
		}
	}, [view, activeIndex]);

	// The notice has exactly one control. Landing focus on it is what makes
	// Enter, Space, and a screen reader all work the moment it appears.
	useEffect(() => {
		if (view === 'update-notice') {
			backButtonRef.current?.focus();
		}
	}, [view]);

	const move = (delta: number) => {
		const at = selectable.indexOf(activeIndex);
		const next = selectable.at((at + delta + selectable.length) % selectable.length);
		if (next !== undefined) {
			setActiveIndex(next);
		}
	};

	/** Runs an item's action, shared by pointer and keyboard activation. */
	const choose = (entry: MenuEntry) => {
		if (isSeparator(entry) || entry.disabled) {
			return;
		}
		entry.onSelect();
		if (!entry.keepOpen) {
			tray.dismiss();
		}
	};

	const onKeyDown = (event: React.KeyboardEvent) => {
		if (view === 'update-notice') {
			// A back control reads as "Escape gets me out of this" before it
			// reads as "Escape closes the whole tray" — and stopping propagation
			// keeps `useTrayMenu`'s own window-level Escape listener, which would
			// otherwise also fire for the same keypress, from dismissing the
			// popup out from under the notice instead of merely leaving it.
			if (event.key === 'Escape') {
				event.preventDefault();
				event.stopPropagation();
				setView('menu');
			}
			return;
		}

		if (event.key === 'ArrowDown') {
			event.preventDefault();
			move(1);
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			move(-1);
		} else if (event.key === 'Home') {
			event.preventDefault();
			setActiveIndex(selectable.at(0) ?? -1);
		} else if (event.key === 'End') {
			event.preventDefault();
			setActiveIndex(selectable.at(-1) ?? -1);
		}
	};

	return (
		// The handler sits on the menu itself rather than on a wrapper div:
		// `menu` is an interactive role, so this is a real widget handling its
		// own keys rather than a bare element pretending to be one.
		<MenuSurface
			ref={tray.surfaceRef}
			role="menu"
			aria-label="Launcher"
			className="w-fit"
			onKeyDown={onKeyDown}
		>
			<MenuHeader
				name="Launcher"
				version={runtime.info ? `v${runtime.info.suiteVersion}` : 'v0.0.0'}
				icon={LayoutIcon}
				isRunning
			/>
			<MenuSeparator />

			{view === 'update-notice' ? (
				<UpdateNotice onBack={() => setView('menu')} closeButtonRef={backButtonRef} />
			) : (
				entries.map((entry, index) =>
					isSeparator(entry) ? (
						<MenuSeparator key={entry.id} />
					) : (
						<MenuItem
							key={entry.id}
							item={entry}
							data-highlighted={index === activeIndex ? '' : undefined}
							ref={(node) => {
								if (node) {
									itemRefs.current.set(index, node);
								} else {
									itemRefs.current.delete(index);
								}
							}}
							onPointerEnter={() => !entry.disabled && setActiveIndex(index)}
							onClick={() => choose(entry)}
							onKeyDown={(event) => {
								if (event.key === 'Enter' || event.key === ' ') {
									event.preventDefault();
									choose(entry);
								}
							}}
						/>
					),
				)
			)}
		</MenuSurface>
	);
}
