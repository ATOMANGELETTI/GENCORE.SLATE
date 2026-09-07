#!/usr/bin/env bun
/**
 * Propagates the suite version outward from the root `package.json`.
 *
 *   bun run scripts/bun-version.ts           write
 *   bun run scripts/bun-version.ts --check   fail if anything disagrees
 *
 * The suite ships as one product with one version number (ADR 0009).
 * Changesets bumps the JavaScript packages; this closes the loop by writing
 * the same number into the Cargo workspace and every `tauri.conf.json`.
 *
 * The `--check` mode runs in CI, so a hand-edited version cannot merge.
 */

import { join } from 'node:path';

import { SUITE_APPS } from './lib/install-layout.ts';

const REPO_ROOT = join(import.meta.dir, '..');
const isCheck = process.argv.includes('--check');

/** One file whose version must match, and how to read and rewrite it. */
type VersionTarget = {
	path: string;
	read: (contents: string) => string | null;
	write: (contents: string, version: string) => string;
};

/**
 * Only the `[workspace.package]` version is rewritten.
 *
 * The pattern is deliberately anchored to that table: a loose
 * `version = "..."` replacement would also rewrite dependency versions in
 * `[workspace.dependencies]`, which would be catastrophic and silent.
 */
const CARGO_WORKSPACE_VERSION = /(\[workspace\.package\][^[]*?\bversion\s*=\s*")([^"]+)(")/s;

const targets: VersionTarget[] = [
	{
		path: 'Cargo.toml',
		read: (contents) => CARGO_WORKSPACE_VERSION.exec(contents)?.[2] ?? null,
		write: (contents, version) => contents.replace(CARGO_WORKSPACE_VERSION, `$1${version}$3`),
	},
	...SUITE_APPS.map((app) => ({
		path: `tauri/${app}/src-tauri/tauri.conf.json`,
		read: (contents: string) => (JSON.parse(contents) as { version?: string }).version ?? null,
		write: (contents: string, version: string) => {
			const config = JSON.parse(contents) as Record<string, unknown>;
			config.version = version;
			return `${JSON.stringify(config, null, '\t')}\n`;
		},
	})),
	...SUITE_APPS.map((app) => ({
		path: `tauri/${app}/package.json`,
		read: (contents: string) => (JSON.parse(contents) as { version?: string }).version ?? null,
		write: (contents: string, version: string) => {
			const pkg = JSON.parse(contents) as Record<string, unknown>;
			pkg.version = version;
			return `${JSON.stringify(pkg, null, '\t')}\n`;
		},
	})),
];

const root = await Bun.file(join(REPO_ROOT, 'package.json')).json();
const version = root.version as string;

if (!/^\d+\.\d+\.\d+/.test(version)) {
	console.error(`The root package.json version "${version}" is not a semantic version.`);
	process.exit(1);
}

const mismatches: string[] = [];
let updated = 0;

for (const target of targets) {
	const file = Bun.file(join(REPO_ROOT, target.path));

	if (!(await file.exists())) {
		mismatches.push(`${target.path} — file is missing`);
		continue;
	}

	const contents = await file.text();
	const current = target.read(contents);

	if (current === version) {
		continue;
	}

	if (isCheck) {
		mismatches.push(`${target.path} — found ${current ?? 'nothing'}, expected ${version}`);
		continue;
	}

	const rewritten = target.write(contents, version);

	if (target.read(rewritten) !== version) {
		mismatches.push(`${target.path} — the version could not be rewritten`);
		continue;
	}

	await Bun.write(join(REPO_ROOT, target.path), rewritten);
	console.warn(`  ${target.path}: ${current ?? 'unset'} → ${version}`);
	updated += 1;
}

if (mismatches.length > 0) {
	console.error(
		`\nVersions disagree with the root package.json (${version}):\n\n${mismatches
			.map((entry) => `  - ${entry}`)
			.join('\n')}\n\nRun: bun run scripts/bun-version.ts\n`,
	);
	process.exit(1);
}

console.warn(
	isCheck
		? `version:check — every file agrees on ${version}.`
		: `version — ${version} propagated to ${updated} file(s).`,
);
