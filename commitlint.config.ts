import type { UserConfig } from '@commitlint/types';

/**
 * Conventional Commits, with the scope vocabulary constrained to the actual
 * shape of this monorepo. A commit that names a scope which does not exist is
 * almost always a commit that touched the wrong project.
 *
 * Enforced by .husky/commit-msg.
 */
const config: UserConfig = {
	extends: ['@commitlint/config-conventional'],
	rules: {
		'type-enum': [
			2,
			'always',
			[
				'feat',
				'fix',
				'perf',
				'refactor',
				'style',
				'docs',
				'test',
				'build',
				'ci',
				'chore',
				'revert',
				'security',
			],
		],
		'scope-enum': [
			2,
			'always',
			[
				// Applications
				'launcher',
				'terminal',
				'explorer',
				// Rust crates
				'core',
				'paths',
				'config',
				'db',
				'ipc',
				'broker',
				'runtime',
				'process',
				'shim',
				// TypeScript packages
				'tokens',
				'ui-kit',
				'icons',
				'bindings',
				'utils',
				'testing',
				// Cross-cutting
				'agents',
				'moon',
				'deps',
				'release',
				'ci',
				'docs',
				'packaging',
				'security',
				'repo',
			],
		],
		'scope-empty': [1, 'never'],
		'subject-case': [2, 'always', 'lower-case'],
		'header-max-length': [2, 'always', 100],
		'body-max-line-length': [1, 'always', 100],
	},
};

export default config;
