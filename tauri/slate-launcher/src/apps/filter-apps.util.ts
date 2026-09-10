import { rankByMatch } from '../search/fuzzy-match.util.ts';
import type { AppSection, LauncherApp } from './app.types.ts';

/**
 * Turning the flat application list into what the column actually renders.
 *
 * Two steps, kept separate because they answer different questions. Filtering
 * asks "which of these does the user mean"; grouping asks "how are they laid
 * out". Combining them would make it impossible to render an ungrouped list of
 * search results, which is exactly what a search should produce.
 */

/** Applications matching the query, best first. An empty query keeps them all. */
export function filterApps(apps: LauncherApp[], query: string): LauncherApp[] {
	const trimmed = query.trim();
	if (trimmed.length === 0) {
		return apps;
	}

	return rankByMatch(apps, trimmed, (app) => app.name).map(({ item }) => item);
}

/**
 * Groups applications into the sections the list draws.
 *
 * Pinned first, then the suite's own applications, then everything portable. A
 * pinned application appears **only** under `PINNED` — showing it twice would
 * make the list longer for having been organised, and leave the user wondering
 * whether the two rows were the same thing.
 *
 * Empty sections are dropped rather than rendered with a heading and nothing
 * under it, which is what makes an unpinned Launcher show no `PINNED` heading
 * at all.
 */
export function groupApps(apps: LauncherApp[], pinnedIds: string[]): AppSection[] {
	const pinned: LauncherApp[] = [];
	const suite: LauncherApp[] = [];
	const portable: LauncherApp[] = [];

	for (const app of apps) {
		if (pinnedIds.includes(app.id)) {
			pinned.push(app);
		} else if (app.source === 'gencore') {
			suite.push(app);
		} else {
			portable.push(app);
		}
	}

	// Pinned keeps the order the user pinned in — that order is the only thing
	// the user said about it, so sorting it alphabetically would discard the
	// one piece of information the section carries.
	pinned.sort((a, b) => pinnedIds.indexOf(a.id) - pinnedIds.indexOf(b.id));

	return [
		{ group: 'pinned', label: 'Pinned', apps: pinned },
		{ group: 'suite', label: 'Suite', apps: suite },
		{ group: 'portable', label: 'Portable apps', apps: portable },
	].filter((section): section is AppSection => section.apps.length > 0);
}

/** Every application in a set of sections, in the order they are rendered. */
export function flattenSections(sections: AppSection[]): LauncherApp[] {
	return sections.flatMap((section) => section.apps);
}

/** How many applications have an update waiting. Drives the status-bar count. */
export function countUpdates(apps: LauncherApp[]): number {
	return apps.filter((app) => app.state === 'update').length;
}

/** How many applications are running. */
export function countRunning(apps: LauncherApp[]): number {
	return apps.filter((app) => app.state === 'running').length;
}
