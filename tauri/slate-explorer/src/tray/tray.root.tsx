import { FolderIcon } from '@slate/icons';
import { useRuntimeInfo, useTrayMenu } from '@slate/ipc';
import { isSeparator, MenuHeader, MenuItem, MenuSeparator, MenuSurface } from '@slate/ui-kit';
import { useEffect, useRef, useState } from 'react';

import { buildTrayMenu } from './tray.menu.ts';

/**
 * The tray menu, rendered as a whole window.
 *
 * It reuses the kit's menu surface rather than reimplementing it, which is the
 * entire justification for the menu being a window at all (ADR 0012): a native
 * Windows menu could not have looked like the rest of the suite.
 *
 * Keyboard handling is here rather than from Radix, because there is no trigger
 * and no layer — the window *is* the menu, and it is always open while visible.
 */
export function TrayMenuRoot() {
	const tray = useTrayMenu();
	const runtime = useRuntimeInfo();
	const entries = buildTrayMenu(tray).filter(
		(entry) => isSeparator(entry) || !entry.disabled || entry.unavailableReason,
	);

	const selectable = entries.flatMap((entry, index) =>
		isSeparator(entry) || entry.disabled ? [] : [index],
	);
	const [activeIndex, setActiveIndex] = useState(selectable.at(0) ?? -1);
	const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

	// Focus follows the active item so a screen reader announces it, and so the
	// window has somewhere to put focus when it opens.
	useEffect(() => {
		itemRefs.current.get(activeIndex)?.focus();
	}, [activeIndex]);

	const move = (delta: number) => {
		const at = selectable.indexOf(activeIndex);
		const next = selectable.at((at + delta + selectable.length) % selectable.length);
		if (next !== undefined) {
			setActiveIndex(next);
		}
	};

	const onKeyDown = (event: React.KeyboardEvent) => {
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
			aria-label="Explorer"
			className="w-fit"
			onKeyDown={onKeyDown}
		>
			<MenuHeader
				name="Explorer"
				version={runtime.info ? `v${runtime.info.suiteVersion}` : 'v0.0.0'}
				icon={FolderIcon}
				isRunning
			/>
			<MenuSeparator />

			{entries.map((entry, index) =>
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
						onClick={() => {
							if (entry.disabled) {
								return;
							}
							entry.onSelect();
							tray.dismiss();
						}}
						onKeyDown={(event) => {
							if (event.key === 'Enter' || event.key === ' ') {
								event.preventDefault();
								if (!entry.disabled) {
									entry.onSelect();
									tray.dismiss();
								}
							}
						}}
					/>
				),
			)}
		</MenuSurface>
	);
}
