#!/usr/bin/env bun
/**
 * Writes the generated stylesheet.
 *
 *   bun run scripts/build-tokens.ts           regenerate
 *   bun run scripts/build-tokens.ts --check   fail if it is out of date
 *
 * The check mode runs in CI for the same reason the agent-docs generator has
 * one: a generated file committed out of step with its source is worse than no
 * generated file at all, because everything downstream silently uses stale
 * values.
 */

import { join } from 'node:path';

import { generateTokensCss } from '../src/generate/css.generator.ts';

const OUTPUT = join(import.meta.dir, '..', 'src', 'generated', 'tokens.css');

const isCheck = process.argv.includes('--check');
const generated = generateTokensCss();

if (isCheck) {
	const file = Bun.file(OUTPUT);
	const current = (await file.exists()) ? await file.text() : null;

	if (current !== generated) {
		console.error('tokens.css is out of date.\n\nRun: moon run slate-tokens:build');
		process.exit(1);
	}

	console.warn('tokens:check — the generated stylesheet is up to date.');
} else {
	await Bun.write(OUTPUT, generated);
	console.warn(`tokens:build — wrote ${OUTPUT}`);
}
