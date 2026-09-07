#!/usr/bin/env bun
/**
 * Runs an application in development.
 *
 *   bun run dev                 pick from a list
 *   bun run dev:launcher        run one directly
 *
 * The important part is what it does before starting Tauri: it points the
 * application at the repository's own `installDir` as its portable root. A
 * development build with no root would fall back to nothing and refuse to
 * start — which is the correct behaviour, and not a useful way to work.
 */

import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

import { LAYOUT_DIRECTORIES, rootMarker, SUITE_APPS, seedConfig } from './lib/install-layout.ts';

const REPO_ROOT = join(import.meta.dir, '..');
const DEV_ROOT = process.env.SLATE_DEV_ROOT ?? join(REPO_ROOT, 'installDir');

/** Creates the development portable root if it is not already there. */
async function ensureDevRoot(): Promise<void> {
	for (const directory of LAYOUT_DIRECTORIES) {
		await mkdir(join(DEV_ROOT, directory), { recursive: true });
	}

	const marker = Bun.file(join(DEV_ROOT, '.slate-root'));
	if (!(await marker.exists())) {
		const version = (await Bun.file(join(REPO_ROOT, 'package.json')).json()).version as string;
		await Bun.write(join(DEV_ROOT, '.slate-root'), rootMarker(version, 'development'));
		console.warn(`Created a development portable root at ${DEV_ROOT}`);
	}

	// Seeded only when absent, so a value changed while developing survives.
	for (const file of seedConfig()) {
		const path = join(DEV_ROOT, file.destination);
		if (!(await Bun.file(path).exists())) {
			await Bun.write(path, file.contents);
		}
	}
}

const requested = process.argv[2];

if (!requested) {
	console.warn('Which application?\n');
	for (const app of SUITE_APPS) {
		console.warn(`  bun run dev:${app.replace('slate-', '')}`);
	}
	console.warn('');
	process.exit(1);
}

const app = SUITE_APPS.find(
	(candidate) => candidate === requested || candidate.endsWith(requested),
);

if (!app) {
	console.error(`Unknown application "${requested}". Expected one of: ${SUITE_APPS.join(', ')}`);
	process.exit(1);
}

await ensureDevRoot();

console.warn(`Starting ${app}\n  portable root: ${DEV_ROOT}\n`);

const proc = Bun.spawn(['bunx', 'tauri', 'dev'], {
	cwd: join(REPO_ROOT, 'tauri', app),
	stdout: 'inherit',
	stderr: 'inherit',
	env: {
		...process.env,
		SLATE_DEV_ROOT: DEV_ROOT,
		SLATE_LOG: process.env.SLATE_LOG ?? 'debug',
		SLATE_LOG_CONSOLE: process.env.SLATE_LOG_CONSOLE ?? '1',
	},
});

process.exit(await proc.exited);
