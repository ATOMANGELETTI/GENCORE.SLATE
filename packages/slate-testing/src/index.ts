/**
 * `@slate/testing` — shared test helpers.
 *
 * The DOM environment itself is installed by `./setup/bun.setup.ts`, which is
 * preloaded for every test through the root `bunfig.toml`. Import from here
 * for rendering and fixtures.
 */

export { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
export { makeRuntimeInfo, makeWindowChrome } from './fixtures/runtime.fixture.ts';
export { userEvent } from './helpers/user-event.helper.ts';
