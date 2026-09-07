#!/usr/bin/env bun
/**
 * Manages the bundled fixed-version WebView2 runtime.
 *
 *   bun run webview2:fetch                     extract a downloaded archive
 *   bun run scripts/bun-webview2.ts --install <dir>   copy into a packaged tree
 *   bun run scripts/bun-webview2.ts --status
 *
 * ## Why this cannot be fully automated
 *
 * Microsoft publishes a stable link for the *evergreen bootstrapper* but not
 * for the *fixed-version* archive, which is the one a portable application
 * needs (ADR 0005). The archive therefore has to be downloaded once, by a
 * person, from the Microsoft developer site.
 *
 * Everything after that is automated: this script verifies the archive against
 * a pinned SHA-256, extracts it, caches the result, and copies it into a
 * packaged tree. See `docs/webview2.md`.
 */

import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const REPO_ROOT = join(import.meta.dir, '..');
const CACHE = join(REPO_ROOT, '.cache/webview2');
const LOCKFILE = join(REPO_ROOT, 'webview2.lock.json');

type Lockfile = {
	version: string;
	sha256: string;
	/** Where a person can obtain this exact archive. */
	source: string;
};

async function readLockfile(): Promise<Lockfile> {
	const file = Bun.file(LOCKFILE);

	if (!(await file.exists())) {
		throw new Error(
			`${LOCKFILE} is missing. It pins the runtime version the suite ships; see docs/webview2.md.`,
		);
	}

	return file.json() as Promise<Lockfile>;
}

/** Whether the cache holds a usable runtime. */
async function isCached(): Promise<boolean> {
	return Bun.file(join(CACHE, 'msedgewebview2.exe')).exists();
}

async function status(): Promise<void> {
	const lock = await readLockfile();
	const cached = await isCached();

	console.warn(`WebView2 fixed-version runtime`);
	console.warn(`  pinned version : ${lock.version}`);
	console.warn(`  cached         : ${cached ? `yes (${CACHE})` : 'no'}`);

	if (!cached) {
		console.warn(`\n  Obtain it from: ${lock.source}`);
		console.warn(`  Then run: SLATE_WEBVIEW2_CAB=<path> bun run webview2:fetch`);
	}
}

/** Verifies and extracts a downloaded archive into the cache. */
async function fetchRuntime(): Promise<void> {
	const lock = await readLockfile();
	const archive = process.env.SLATE_WEBVIEW2_CAB;

	if (!archive) {
		throw new Error(
			[
				'No archive was supplied.',
				'',
				`Download the fixed-version runtime ${lock.version} from:`,
				`  ${lock.source}`,
				'',
				'Then run:',
				'  SLATE_WEBVIEW2_CAB=C:\\path\\to\\runtime.cab bun run webview2:fetch',
			].join('\n'),
		);
	}

	const file = Bun.file(archive);
	if (!(await file.exists())) {
		throw new Error(`No file at ${archive}`);
	}

	const digest = new Bun.CryptoHasher('sha256').update(await file.arrayBuffer()).digest('hex');

	if (lock.sha256 && lock.sha256 !== digest) {
		throw new Error(
			[
				'The archive does not match the pinned checksum.',
				'',
				`  expected ${lock.sha256}`,
				`  found    ${digest}`,
				'',
				'Either the wrong version was downloaded, or the file is corrupt.',
				'Do not bypass this check: the runtime ships inside the product.',
			].join('\n'),
		);
	}

	await rm(CACHE, { recursive: true, force: true });
	await mkdir(CACHE, { recursive: true });

	// expand.exe ships with Windows and handles .cab natively.
	const proc = Bun.spawn(['expand', archive, '-F:*', CACHE], {
		stdout: 'inherit',
		stderr: 'inherit',
	});

	if ((await proc.exited) !== 0) {
		throw new Error('Extracting the archive failed.');
	}

	if (!(await isCached())) {
		throw new Error(
			`Extraction produced no msedgewebview2.exe in ${CACHE}. The archive may not be the fixed-version runtime.`,
		);
	}

	console.warn(`✓ WebView2 ${lock.version} cached at ${CACHE}`);
}

/** Copies the cached runtime into a packaged tree. */
async function install(target: string): Promise<void> {
	if (!(await isCached())) {
		throw new Error(`Nothing cached at ${CACHE}. Run: bun run webview2:fetch`);
	}

	await mkdir(target, { recursive: true });

	let copied = 0;
	const glob = new Bun.Glob('**/*');

	for await (const entry of glob.scan({ cwd: CACHE, onlyFiles: true })) {
		await Bun.write(join(target, entry), Bun.file(join(CACHE, entry)));
		copied += 1;
	}

	console.warn(`✓ ${copied} runtime files copied into ${target}`);
}

// ── Entry point ──────────────────────────────────────────────────────────────

try {
	const args = process.argv.slice(2);
	const installIndex = args.indexOf('--install');

	if (installIndex !== -1) {
		const target = args[installIndex + 1];
		if (!target) {
			throw new Error('--install needs a destination directory.');
		}
		await install(target);
	} else if (args.includes('--status')) {
		await status();
	} else {
		await fetchRuntime();
	}
} catch (error) {
	console.error(`\n${error instanceof Error ? error.message : String(error)}\n`);
	process.exit(1);
}
