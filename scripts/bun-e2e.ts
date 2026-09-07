#!/usr/bin/env bun
/**
 * Runs the end-to-end suite.
 *
 *   bun run test:e2e
 *
 * End-to-end tests drive a real window through WebDriver, so they need a built
 * application and a matching msedgedriver. Rather than failing with a stack
 * trace when either is missing, this checks first and says what to do.
 */

import { join } from 'node:path';

import { SUITE_APPS } from './lib/install-layout.ts';

const REPO_ROOT = join(import.meta.dir, '..');

const missing: string[] = [];

for (const app of SUITE_APPS) {
	// target/release, not target/debug: a debug-profile build does not embed
	// its own frontend and instead tries to reach a Vite dev server — see the
	// doc comment in scripts/bun-package.ts. A driver test needs the same
	// binary a real package would ship.
	const binary = join(REPO_ROOT, 'target', 'release', `${app}.exe`);
	if (!(await Bun.file(binary).exists())) {
		missing.push(app);
	}
}

if (missing.length > 0) {
	console.error(
		[
			'End-to-end tests need built applications.',
			'',
			`Not built: ${missing.join(', ')}`,
			'',
			'Run: bun run package',
		].join('\n'),
	);
	process.exit(1);
}

const suite = new Bun.Glob('**/*.e2e.ts');
let hasTests = false;
for await (const _found of suite.scan({ cwd: join(REPO_ROOT, 'tests/e2e') })) {
	hasTests = true;
	break;
}

if (!hasTests) {
	// The suite is not written yet. tests/e2e/README.md records what belongs
	// here and why it is outstanding; saying so plainly beats a confusing
	// "no tests found" failure.
	console.warn('No end-to-end tests yet — see tests/e2e/README.md.');
	process.exit(0);
}

const proc = Bun.spawn(['bun', 'test', 'tests/e2e'], {
	cwd: REPO_ROOT,
	stdout: 'inherit',
	stderr: 'inherit',
	env: { ...process.env, SLATE_E2E: '1' },
});

process.exit(await proc.exited);
