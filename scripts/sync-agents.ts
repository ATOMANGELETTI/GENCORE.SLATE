#!/usr/bin/env bun
/**
 * Generates every AI-assistant instruction file from `.agents/`.
 *
 * Four tools read project guidance from four different places. Maintaining
 * four copies by hand fails within a week, so `.agents/` is the only file
 * anyone edits and this script produces the rest.
 *
 *   bun run scripts/sync-agents.ts           write the generated files
 *   bun run scripts/sync-agents.ts --check   fail if any file is out of date
 *
 * The --check mode runs in CI, so a change to `.agents/` that was not
 * regenerated cannot merge.
 */

import { rm } from 'node:fs/promises';
import { basename, join } from 'node:path';

const REPO_ROOT = join(import.meta.dir, '..');
const RULES_DIR = join(REPO_ROOT, '.agents', 'rules');

const BANNER_TEXT = [
	'GENERATED FILE — DO NOT EDIT.',
	'',
	'Source: .agents/rules/',
	'Regenerate: bun run agents:sync',
	'',
	'Edits here are overwritten by the next sync and rejected by CI',
	'(`bun run agents:check`). Change the rule in .agents/ instead.',
];

/** A single rule document parsed from `.agents/rules/*.md`. */
type Rule = {
	id: string;
	title: string;
	description: string;
	globs: string[];
	alwaysApply: boolean;
	body: string;
	sourceFile: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Frontmatter
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Minimal YAML frontmatter reader.
 *
 * The rule files use a deliberately tiny subset — strings, booleans, and flow
 * sequences of strings — so a full YAML dependency would be a supply-chain
 * cost with no benefit. Anything outside that subset is a rule file that needs
 * simplifying, not a parser that needs extending.
 */
function parseFrontmatter(
	source: string,
	file: string,
): { data: Record<string, unknown>; body: string } {
	if (!source.startsWith('---\n')) {
		throw new Error(`${file}: missing YAML frontmatter`);
	}

	const end = source.indexOf('\n---', 4);
	if (end === -1) {
		throw new Error(`${file}: frontmatter is not terminated`);
	}

	const data: Record<string, unknown> = {};
	for (const line of source.slice(4, end).split('\n')) {
		const trimmed = line.trim();
		if (trimmed === '' || trimmed.startsWith('#')) continue;

		const separator = trimmed.indexOf(':');
		if (separator === -1) throw new Error(`${file}: cannot parse frontmatter line "${trimmed}"`);

		const key = trimmed.slice(0, separator).trim();
		const rawValue = trimmed.slice(separator + 1).trim();

		if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
			data[key] = rawValue
				.slice(1, -1)
				.split(',')
				.map((entry) => entry.trim().replace(/^['"]|['"]$/g, ''))
				.filter((entry) => entry.length > 0);
		} else if (rawValue === 'true' || rawValue === 'false') {
			data[key] = rawValue === 'true';
		} else {
			data[key] = rawValue.replace(/^['"]|['"]$/g, '');
		}
	}

	return { data, body: source.slice(end + 4).replace(/^\n+/, '') };
}

async function loadRules(): Promise<Rule[]> {
	const glob = new Bun.Glob('*.md');
	const files: string[] = [];
	for await (const entry of glob.scan({ cwd: RULES_DIR })) files.push(entry);
	files.sort();

	if (files.length === 0) throw new Error(`no rule files found in ${RULES_DIR}`);

	const rules: Rule[] = [];
	for (const file of files) {
		const source = await Bun.file(join(RULES_DIR, file)).text();
		const { data, body } = parseFrontmatter(source, file);

		for (const required of ['id', 'title', 'description'] as const) {
			if (typeof data[required] !== 'string' || (data[required] as string).length === 0) {
				throw new Error(`${file}: frontmatter is missing "${required}"`);
			}
		}

		const expectedId = basename(file, '.md');
		if (data.id !== expectedId) {
			throw new Error(`${file}: frontmatter id "${String(data.id)}" must match the filename`);
		}

		rules.push({
			id: data.id as string,
			title: data.title as string,
			description: data.description as string,
			globs: Array.isArray(data.globs) ? (data.globs as string[]) : ['**/*'],
			alwaysApply: data.alwaysApply === true,
			body: body.trimEnd(),
			sourceFile: file,
		});
	}

	return rules;
}

// ─────────────────────────────────────────────────────────────────────────────
// Rendering
// ─────────────────────────────────────────────────────────────────────────────

const htmlBanner = () =>
	`<!--\n${BANNER_TEXT.map((line) => (line ? `  ${line}` : '')).join('\n')}\n-->`;

/** Strips the leading `# Title` so an inlined rule can be nested under a heading. */
function bodyWithoutTitle(rule: Rule): string {
	return rule.body.replace(/^#\s+.*\n+/, '').trimEnd();
}

function renderIndexTable(rules: Rule[]): string {
	const rows = rules.map(
		(rule) =>
			`| [\`${rule.id}\`](.agents/rules/${rule.sourceFile}) | ${rule.description} | ${rule.alwaysApply ? 'always' : 'on match'} |`,
	);
	return ['| Rule | Covers | Applies |', '| --- | --- | --- |', ...rows].join('\n');
}

function renderAgentsMd(rules: Rule[]): string {
	const always = rules.filter((rule) => rule.alwaysApply);
	const contextual = rules.filter((rule) => !rule.alwaysApply);

	return [
		htmlBanner(),
		'',
		'# AGENTS.md — GENCORE.SLATE',
		'',
		'Instructions for any AI assistant working in this repository. The rules below',
		'are authoritative: where a general convention and a rule here disagree, the',
		'rule here wins.',
		'',
		'## Rule index',
		'',
		renderIndexTable(rules),
		'',
		'---',
		'',
		'## Always-applicable rules',
		'',
		'These apply to every task in this repository, reproduced here in full.',
		'',
		...always.flatMap((rule) => [`### ${rule.title}`, '', bodyWithoutTitle(rule), '', '---', '']),
		'## Contextual rules',
		'',
		'Read the relevant file before working in the area it governs.',
		'',
		...contextual.map(
			(rule) =>
				`- **${rule.title}** — ${rule.description}\n  \`.agents/rules/${rule.sourceFile}\` (${rule.globs.join(', ')})`,
		),
		'',
		'## Architecture reference',
		'',
		'- `.agents/architecture/module-map.md` — where every module lives and what depends on what',
		'- `.agents/architecture/ipc-protocol.md` — the two IPC channels and their contracts',
		'- `.agents/architecture/install-layout.md` — the portable directory layout',
		'- `.agents/architecture/adr/` — why each significant decision was made',
		'- `.agents/workflows/` — step-by-step procedures for recurring tasks',
		'',
	].join('\n');
}

function renderClaudeMd(rules: Rule[]): string {
	const always = rules.filter((rule) => rule.alwaysApply);
	const contextual = rules.filter((rule) => !rule.alwaysApply);

	return [
		htmlBanner(),
		'',
		'# CLAUDE.md — GENCORE.SLATE',
		'',
		'## Orientation',
		'',
		'GENCORE.SLATE is a portable, Windows-only suite of desktop applications built',
		'with Rust, Tauri v2, and React, distributed as a zip that runs from anywhere',
		'and writes nothing outside its own directory.',
		'',
		'```bash',
		'bun run check          # lint, typecheck, test, build — everything',
		'bun run dev:launcher   # run an app in development',
		'bun run package        # build the portable zip',
		'bun run agents:sync    # regenerate these instruction files',
		'```',
		'',
		'## Rule index',
		'',
		renderIndexTable(rules),
		'',
		'---',
		'',
		'## Always-applicable rules',
		'',
		...always.flatMap((rule) => [`### ${rule.title}`, '', bodyWithoutTitle(rule), '', '---', '']),
		'## Contextual rules',
		'',
		'Read the file before working in the area it governs.',
		'',
		...contextual.map(
			(rule) => `- **${rule.title}** — ${rule.description}\n  \`.agents/rules/${rule.sourceFile}\``,
		),
		'',
		'## Claude Code specifics',
		'',
		'- Slash commands for this project live in `.claude/commands/`.',
		'- Specialised subagents live in `.claude/agents/`.',
		'- `.mcp.json` exposes Moon over MCP: query the real project and task graph',
		'  rather than inferring it from file paths.',
		'- Never edit a file carrying a `DO NOT EDIT` banner. Edit `.agents/` and run',
		'  `bun run agents:sync`.',
		'',
	].join('\n');
}

function renderCursorRule(rule: Rule): string {
	return [
		'---',
		`description: ${rule.description}`,
		`globs: ${rule.globs.join(',')}`,
		`alwaysApply: ${rule.alwaysApply}`,
		'---',
		'',
		htmlBanner(),
		'',
		rule.body,
		'',
	].join('\n');
}

function renderCopilotInstruction(rule: Rule): string {
	return [
		'---',
		`applyTo: '${rule.globs.join(',')}'`,
		`description: ${rule.description}`,
		'---',
		'',
		htmlBanner(),
		'',
		rule.body,
		'',
	].join('\n');
}

function renderCopilotRepositoryInstructions(rules: Rule[]): string {
	const always = rules.filter((rule) => rule.alwaysApply);

	return [
		htmlBanner(),
		'',
		'# GitHub Copilot instructions — GENCORE.SLATE',
		'',
		'A portable, Windows-only desktop suite built with Rust, Tauri v2, and React.',
		'Bun is the only JavaScript runtime and package manager. Moon orchestrates the',
		'monorepo. Path-specific rules live in `.github/instructions/`.',
		'',
		...always.flatMap((rule) => [`## ${rule.title}`, '', bodyWithoutTitle(rule), '']),
	].join('\n');
}

function renderAntigravityRule(rule: Rule): string {
	return [
		'---',
		`title: ${rule.title}`,
		`description: ${rule.description}`,
		`globs: ${rule.globs.join(',')}`,
		`alwaysOn: ${rule.alwaysApply}`,
		'---',
		'',
		htmlBanner(),
		'',
		rule.body,
		'',
	].join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Orchestration
// ─────────────────────────────────────────────────────────────────────────────

function buildOutputs(rules: Rule[]): Map<string, string> {
	const outputs = new Map<string, string>();

	outputs.set('AGENTS.md', renderAgentsMd(rules));
	outputs.set('CLAUDE.md', renderClaudeMd(rules));
	outputs.set('.github/copilot-instructions.md', renderCopilotRepositoryInstructions(rules));

	for (const rule of rules) {
		outputs.set(`.cursor/rules/${rule.id}.mdc`, renderCursorRule(rule));
		outputs.set(`.github/instructions/${rule.id}.instructions.md`, renderCopilotInstruction(rule));
		outputs.set(`.agent/rules/${rule.id}.md`, renderAntigravityRule(rule));
	}

	return outputs;
}

/** Generated directories are owned entirely by this script, so stale files are removed. */
const GENERATED_DIRS = ['.cursor/rules', '.github/instructions', '.agent/rules'];

async function findStaleFiles(expected: Set<string>): Promise<string[]> {
	const stale: string[] = [];
	for (const dir of GENERATED_DIRS) {
		const glob = new Bun.Glob('*');
		try {
			for await (const entry of glob.scan({ cwd: join(REPO_ROOT, dir) })) {
				const relative = `${dir}/${entry}`;
				if (!expected.has(relative)) stale.push(relative);
			}
		} catch {
			// The directory does not exist yet — nothing to clean.
		}
	}
	return stale;
}

/** Which generated files no longer match what the rules would produce. */
async function findDrift(outputs: Map<string, string>): Promise<string[]> {
	const drifted: string[] = [];

	for (const [relative, content] of outputs) {
		const file = Bun.file(join(REPO_ROOT, relative));
		const current = (await file.exists()) ? await file.text() : null;
		if (current !== content) {
			drifted.push(relative);
		}
	}

	return drifted;
}

/** Reports drift and exits non-zero. Used by CI. */
async function check(
	outputs: Map<string, string>,
	stale: string[],
	ruleCount: number,
): Promise<void> {
	const drifted = await findDrift(outputs);

	if (drifted.length === 0 && stale.length === 0) {
		console.warn(`agents:check — ${outputs.size} generated files match ${ruleCount} rules.`);
		return;
	}

	console.error('Agent instruction files are out of date.\n');
	for (const file of drifted) {
		console.error(`  changed  ${file}`);
	}
	for (const file of stale) {
		console.error(`  stale    ${file}`);
	}
	console.error('\nRun: bun run agents:sync');
	process.exit(1);
}

/** Writes every generated file and removes anything left over. */
async function write(
	outputs: Map<string, string>,
	stale: string[],
	ruleCount: number,
): Promise<void> {
	for (const [relative, content] of outputs) {
		await Bun.write(join(REPO_ROOT, relative), content);
	}

	for (const relative of stale) {
		await rm(join(REPO_ROOT, relative), { force: true });
		console.warn(`removed stale ${relative}`);
	}

	console.warn(`agents:sync — wrote ${outputs.size} files from ${ruleCount} rules.`);
}

async function main(): Promise<void> {
	const rules = await loadRules();
	const outputs = buildOutputs(rules);
	const stale = await findStaleFiles(new Set(outputs.keys()));

	if (process.argv.includes('--check')) {
		await check(outputs, stale, rules.length);
	} else {
		await write(outputs, stale, rules.length);
	}
}

await main();
