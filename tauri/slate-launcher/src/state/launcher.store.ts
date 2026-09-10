import type { AccentName, DensityName } from '@slate/tokens';
import { create } from 'zustand';

import type { ViewId } from '../views/view.types.ts';

/**
 * Everything the Launcher window knows about itself.
 *
 * A store rather than context, per `.agents/rules/05-react-and-ui.md`: this is
 * whole-application state, read by the command bar, the app list, the rail, the
 * title bar and the status bar at once. It exposes **actions, not setters** —
 * `openView(id)` rather than `setActiveView`, because "open a view" is a thing
 * that happens and "set the active view field" is not.
 *
 * Nothing here mirrors backend state. Theme lives in the config the Rust side
 * owns and is read through `useRuntimeInfo`; density and accent live here
 * because nothing else owns them yet, and they will move to configuration the
 * moment settings are persisted.
 */

/** Whether the bar is filtering applications or composing a command. */
export type BarMode = 'search' | 'command';

type LauncherState = {
	/** The open view, or `null` at rest. */
	activeView: ViewId | null;
	/** The raw text in the command bar, including any leading slash. */
	query: string;
	/** Which row of the current result list is highlighted. */
	selectedIndex: number;
	/** Applications the user has pinned, in the order they were pinned. */
	pinnedIds: string[];
	density: DensityName;
	accent: AccentName;

	openView: (view: ViewId) => void;
	closeView: () => void;
	/** Opens the view, or closes it if it is already open. */
	toggleView: (view: ViewId) => void;
	setQuery: (query: string) => void;
	clearQuery: () => void;
	/** Moves the highlight, wrapping at both ends, within `count` rows. */
	moveSelection: (delta: number, count: number) => void;
	selectIndex: (index: number) => void;
	togglePin: (appId: string) => void;
	setDensity: (density: DensityName) => void;
	setAccent: (accent: AccentName) => void;
};

/**
 * Whether the query is a command.
 *
 * Derived from the query rather than stored beside it. A separate `mode` field
 * would be a second source of truth for something the text already says, and
 * the two would disagree the first time the query was cleared without the mode
 * being reset.
 */
export function barMode(query: string): BarMode {
	return query.startsWith('/') ? 'command' : 'search';
}

export const useLauncherStore = create<LauncherState>()((set) => ({
	activeView: null,
	query: '',
	selectedIndex: 0,
	pinnedIds: [],
	density: 'comfortable',
	accent: 'cyan',

	openView: (view) => set({ activeView: view }),
	closeView: () => set({ activeView: null }),
	toggleView: (view) => set((state) => ({ activeView: state.activeView === view ? null : view })),

	// Any change to the query invalidates the highlight, because the row that
	// was highlighted is very unlikely to still be at that index. Resetting to
	// the top is what makes Enter always mean "the best match".
	setQuery: (query) => set({ query, selectedIndex: 0 }),
	clearQuery: () => set({ query: '', selectedIndex: 0 }),

	moveSelection: (delta, count) =>
		set((state) => {
			if (count <= 0) {
				return { selectedIndex: 0 };
			}

			// Wraps in both directions. `%` alone gives a negative index when
			// moving up from the first row, so the count is added back first.
			return { selectedIndex: (((state.selectedIndex + delta) % count) + count) % count };
		}),
	selectIndex: (index) => set({ selectedIndex: index }),

	togglePin: (appId) =>
		set((state) => ({
			pinnedIds: state.pinnedIds.includes(appId)
				? state.pinnedIds.filter((id) => id !== appId)
				: [...state.pinnedIds, appId],
		})),

	setDensity: (density) => set({ density }),
	setAccent: (accent) => set({ accent }),
}));
