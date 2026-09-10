#!/usr/bin/env bun
/**
 * Builds the portable suite and packages it as a zip.
 *
 *   bun run package                    quick package, system WebView2 allowed
 *   bun run package:release            full package, bundled runtime required
 *   bun run scripts/bun-package.ts --verify-only dist/installDir
 *
 * Applications are built through the **Tauri CLI** (`tauri build --no-bundle`
 * per app), never through a raw `cargo build`. This was not a style choice —
 * a raw `cargo build --workspace --bins --release` was tried first and
 * produces a binary that repeatedly tries to reach a Vite dev server on
 * localhost and shows a blank "can't reach this page" window, confirmed by
 * both a TCP listener catching the connection attempts and the resulting
 * install's own log. Only going through the actual CLI — which also runs
 * each app's `beforeBuildCommand` for us — produces a binary that correctly
 * serves the embedded frontend. Whatever exact internal signal the CLI sets
 * to make that decision, don't try to replicate it by hand here again;
 * delegate to the CLI instead.
 *
 * `tauri build` compiles in release profile by default (that's what makes
 * this correct), so the `--release` flag on this script controls something
 * else entirely: whether the bundled WebView2 runtime is required.
 *
 * The tree is assembled from the declarative manifest in
 * `lib/install-layout.ts` and then verified against that same manifest, so a
 * file that quietly stopped being copied fails the build rather than shipping.
 */

import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

import {
	LAYOUT_DIRECTORIES,
	layoutFiles,
	rootMarker,
	rootReadme,
	SUITE_APPS,
	seedConfig,
} from './lib/install-layout.ts';

const REPO_ROOT = join(import.meta.dir, '..');
const DIST = join(REPO_ROOT, 'dist');
const TREE = join(DIST, 'installDir');

const args = new Set(process.argv.slice(2));
const isRelease = args.has('--release');
const verifyOnly = args.has('--verify-only');

// ── Helpers ──────────────────────────────────────────────────────────────────

function step(message: string): void {
	console.warn(`\n▸ ${message}`);
}

function detail(message: string): void {
	console.warn(`  ${message}`);
}

async function run(
	command: string[],
	cwd = REPO_ROOT,
	env: Record<string, string> = {},
): Promise<void> {
	const proc = Bun.spawn(command, {
		cwd,
		stdout: 'inherit',
		stderr: 'inherit',
		env: { ...process.env, ...env },
	});
	const code = await proc.exited;

	if (code !== 0) {
		throw new Error(`${command.join(' ')} failed with exit code ${code}`);
	}
}

async function suiteVersion(): Promise<string> {
	const pkg = await Bun.file(join(REPO_ROOT, 'package.json')).json();
	return pkg.version as string;
}

async function buildId(): Promise<string> {
	const timestamp = new Date().toISOString().replace(/\.\d+Z$/, 'Z');

	try {
		const proc = Bun.spawn(['git', 'rev-parse', '--short', 'HEAD'], {
			cwd: REPO_ROOT,
			stdout: 'pipe',
			stderr: 'ignore',
		});
		const sha = (await new Response(proc.stdout).text()).trim();
		return sha ? `${timestamp}+${sha}` : timestamp;
	} catch {
		// A build outside a git checkout is still a valid build.
		return timestamp;
	}
}

// ── Build ────────────────────────────────────────────────────────────────────

async function buildEverything(): Promise<void> {
	step('Building applications');

	// One `tauri build` per app — not a single workspace-wide `cargo build`.
	// See the module doc comment for why: this is the one path proven to
	// produce a binary that actually serves its embedded frontend. Each
	// invocation also runs that app's own `beforeBuildCommand` (`vite build`),
	// so the frontend does not need to be built separately here.
	for (const app of SUITE_APPS) {
		detail(app);
		await run(['bunx', 'tauri', 'build', '--no-bundle'], join(REPO_ROOT, 'tauri', app));
	}

	// The root shim is plain Rust with no webview at all — none of the above
	// applies to it, and a raw cargo build is exactly right here.
	detail('Slate.exe (shim)');
	await run(['cargo', 'build', '--release', '--bin', 'Slate']);
}

// ── Assemble ─────────────────────────────────────────────────────────────────

async function assemble(version: string): Promise<void> {
	step('Assembling the portable tree');

	await rm(TREE, { recursive: true, force: true });

	for (const directory of LAYOUT_DIRECTORIES) {
		await mkdir(join(TREE, directory), { recursive: true });
		// Some zip tools drop empty directories; a marker file keeps the shape.
		await Bun.write(join(TREE, directory, '.gitkeep'), '');
	}

	let copied = 0;
	const missing: string[] = [];

	for (const file of layoutFiles()) {
		// layoutFiles() already points at target/release/ — the Rust build is
		// always release, see the module doc comment.
		const source = join(REPO_ROOT, file.source);

		if (!(await Bun.file(source).exists())) {
			if (file.required) {
				missing.push(`${file.source} — ${file.reason}`);
			}
			continue;
		}

		await Bun.write(join(TREE, file.destination), Bun.file(source));
		copied += 1;
	}

	if (missing.length > 0) {
		throw new Error(
			`The build did not produce everything the layout needs:\n\n${missing
				.map((entry) => `  - ${entry}`)
				.join('\n')}\n\nRun a full build first.`,
		);
	}

	detail(`${copied} files copied`);

	step('Seeding configuration');
	for (const file of seedConfig()) {
		await Bun.write(join(TREE, file.destination), file.contents);
	}
	detail(`${seedConfig().length} configuration files`);

	await copyResources();

	const marker = rootMarker(version, await buildId());
	await Bun.write(join(TREE, '.slate-root'), marker);
	await Bun.write(join(TREE, 'README.txt'), rootReadme(version));
}

/**
 * Copies the checked-in shared resources into the tree.
 *
 * `appdata/resources/` is the one directory whose contents live in the
 * repository rather than being produced by a build — the vendored Nerd Fonts
 * and the Lucide icon set. `LAYOUT_DIRECTORIES` creates the directory, and
 * without this it would ship empty: the zip would have the shape of a portable
 * install and none of the assets.
 *
 * A plain recursive walk rather than a manifest, because the point of the
 * directory is that things can be added to it without a build step needing to
 * be told.
 */
async function copyResources(): Promise<void> {
	const source = join(REPO_ROOT, 'installDir/appdata/resources');
	const glob = new Bun.Glob('**/*');
	let copied = 0;

	for await (const entry of glob.scan({ cwd: source, onlyFiles: true, dot: false })) {
		// `.gitkeep` exists to hold an empty directory open in git. The
		// packaged tree gets its own from `LAYOUT_DIRECTORIES`.
		if (entry.endsWith('.gitkeep')) {
			continue;
		}

		await Bun.write(join(TREE, 'appdata/resources', entry), Bun.file(join(source, entry)));
		copied += 1;
	}

	detail(`${copied} shared resource files`);
}

// ── WebView2 ─────────────────────────────────────────────────────────────────

async function embedWebView2(): Promise<void> {
	step('Embedding the WebView2 runtime');

	const target = join(TREE, 'appdata/binaries/webview2');
	const cached = join(REPO_ROOT, '.cache/webview2');

	if (await Bun.file(join(cached, 'msedgewebview2.exe')).exists()) {
		await run(['bun', 'run', 'scripts/bun-webview2.ts', '--install', target]);
		detail('bundled from the local cache');
		return;
	}

	const message = [
		'The fixed-version WebView2 runtime is not available locally.',
		'',
		'Microsoft publishes no stable direct download URL for it, so it cannot be',
		'fetched automatically. See docs/webview2.md for how to obtain it once.',
		'',
		'Without it the zip still runs on machines that already have WebView2,',
		'but it is not a fully portable build.',
	].join('\n');

	if (isRelease) {
		// A release that silently drops the runtime is a release that is not
		// portable — which is the one promise this product makes.
		throw new Error(message);
	}

	detail('skipped (development build)');
	console.warn(`\n${message}\n`);
}

// ── Verify ───────────────────────────────────────────────────────────────────

async function verify(tree: string): Promise<void> {
	step('Verifying the tree against the manifest');

	const problems: string[] = [];

	for (const directory of LAYOUT_DIRECTORIES) {
		const marker = Bun.file(join(tree, directory, '.gitkeep'));
		if (!(await marker.exists())) {
			problems.push(`missing directory: ${directory}`);
		}
	}

	for (const file of layoutFiles()) {
		if (!file.required) {
			continue;
		}
		if (!(await Bun.file(join(tree, file.destination)).exists())) {
			problems.push(`missing file: ${file.destination} (${file.reason})`);
		}
	}

	for (const required of ['.slate-root', 'README.txt']) {
		if (!(await Bun.file(join(tree, required)).exists())) {
			problems.push(`missing file: ${required}`);
		}
	}

	if (problems.length > 0) {
		throw new Error(
			`The packaged tree is incomplete:\n\n${problems.map((p) => `  - ${p}`).join('\n')}`,
		);
	}

	detail('every declared path is present');
}

// ── Archive ──────────────────────────────────────────────────────────────────

/**
 * Writes `directory` inside `parent` to a zip at `output`.
 *
 * Windows ships bsdtar at `System32\tar.exe`, which writes zip from `-a` and
 * is far faster than Compress-Archive on a tree this size. It has to be called
 * by absolute path: a bare `tar` resolves to Git Bash's build on most
 * developer machines, and that one reads `C:\…` as a remote host and fails
 * with "cannot connect to C:". Compress-Archive is the fallback for a machine
 * without it.
 */
async function compress(parent: string, directory: string, output: string): Promise<void> {
	const systemRoot = process.env.SystemRoot ?? process.env.SYSTEMROOT ?? 'C:\\Windows';
	const bsdtar = join(systemRoot, 'System32', 'tar.exe');

	if (await Bun.file(bsdtar).exists()) {
		await run([bsdtar, '-a', '-c', '-f', output, '-C', parent, directory]);
		return;
	}

	detail('System32\\tar.exe not found; falling back to Compress-Archive');
	await run([
		'powershell',
		'-NoProfile',
		'-NonInteractive',
		'-Command',
		`Compress-Archive -Path '${join(parent, directory)}' -DestinationPath '${output}' -Force`,
	]);
}

async function archive(version: string): Promise<string> {
	step('Creating the archive');

	const name = `SLATE-${version}-win-x64.zip`;
	const output = join(DIST, name);
	await rm(output, { force: true });

	await compress(DIST, 'installDir', output);

	const bytes = await Bun.file(output).arrayBuffer();
	const digest = new Bun.CryptoHasher('sha256').update(bytes).digest('hex');
	await Bun.write(`${output}.sha256`, `${digest} *${name}\n`);

	const megabytes = (bytes.byteLength / 1_000_000).toFixed(1);
	detail(`${name} — ${megabytes} MB`);
	detail(`sha256 ${digest}`);

	return output;
}

// ── Entry point ──────────────────────────────────────────────────────────────

try {
	if (verifyOnly) {
		const target = process.argv[process.argv.indexOf('--verify-only') + 1] ?? TREE;
		await verify(
			target.startsWith('/') || /^[A-Za-z]:/.test(target) ? target : join(REPO_ROOT, target),
		);
		console.warn('\n✓ The tree matches the manifest.\n');
	} else {
		const version = await suiteVersion();
		console.warn(
			`Packaging GENCORE.SLATE ${version} (${isRelease ? 'bundled WebView2 required' : 'system WebView2 allowed'})`,
		);

		await buildEverything();
		await assemble(version);
		await embedWebView2();
		await verify(TREE);
		const output = await archive(version);

		console.warn(`\n✓ ${output}\n`);
	}
} catch (error) {
	console.error(
		`\n✗ Packaging failed.\n\n${error instanceof Error ? error.message : String(error)}\n`,
	);
	process.exit(1);
}
