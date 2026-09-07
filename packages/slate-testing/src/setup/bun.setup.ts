/**
 * Bun test preload, wired up in the root `bunfig.toml`.
 *
 * Installs a DOM so component tests can render, and clears it between tests so
 * one test's markup cannot be found by the next — the usual cause of a suite
 * that passes in isolation and fails when run together.
 *
 * Registration happens at **module scope**, not inside `beforeAll`. A
 * `beforeAll` registered from a preload does not reliably run before the first
 * test file is evaluated when the run is narrowed to a path
 * (`bun test packages/slate-ui-kit/tests`), which is exactly how Moon invokes
 * it — and the failure looks like "a global document has to be available"
 * rather than anything to do with ordering.
 */

import { afterEach } from 'bun:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';

if (typeof document === 'undefined') {
	GlobalRegistrator.register({ url: 'http://localhost/', width: 1280, height: 800 });
}

afterEach(() => {
	if (typeof document !== 'undefined') {
		document.body.innerHTML = '';
		document.documentElement.removeAttribute('data-theme');
	}
});
