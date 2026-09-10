import { beforeEach, describe, expect, mock, test } from 'bun:test';

import { type CommandHandlers, runCommand } from '../../../src/command/run-command.service.ts';

/**
 * Every effect arrives as a callback, so this is testable by handing it spies
 * and reading which one fired. That is the whole reason the service takes
 * handlers rather than reaching for a store and an IPC client itself.
 */
function makeHandlers(): CommandHandlers & {
	[K in keyof CommandHandlers]: ReturnType<typeof mock>;
} {
	return {
		openView: mock(() => {}),
		closeView: mock(() => {}),
		setQuery: mock(() => {}),
		togglePin: mock(() => {}),
		setAccent: mock(() => {}),
		setDensity: mock(() => {}),
		setTheme: mock(() => {}),
		launch: mock(() => {}),
		revealFolder: mock(() => {}),
		quit: mock(() => {}),
	};
}

let handlers: ReturnType<typeof makeHandlers>;

beforeEach(() => {
	handlers = makeHandlers();
});

describe('runCommand', () => {
	test('every command clears the bar', () => {
		// Leaving the text in place would mean the next Enter ran it again,
		// which is how a /quit gets pressed twice.
		for (const input of ['/help', '/about', '/quit', '/run --terminal', '/config --theme dark']) {
			const fresh = makeHandlers();
			runCommand(input, fresh);

			expect(fresh.setQuery).toHaveBeenCalledWith('');
		}
	});

	describe('/run', () => {
		test('starts the suite application a flag names', () => {
			runCommand('/run --terminal', handlers);

			expect(handlers.launch).toHaveBeenCalledWith('slate-terminal');
		});

		test('starts an application named as a bare word', () => {
			runCommand('/run downloader', handlers);

			expect(handlers.launch).toHaveBeenCalledWith('downloader');
		});

		test('matches a bare word fuzzily, as the search box does', () => {
			runCommand('/run dwn', handlers);

			expect(handlers.launch).toHaveBeenCalledWith('downloader');
		});

		test('starts nothing when it names nothing', () => {
			runCommand('/run', handlers);

			expect(handlers.launch).not.toHaveBeenCalled();
		});
	});

	describe('/open and /reveal', () => {
		test('reveals a storage folder', () => {
			runCommand('/open --documents', handlers);

			expect(handlers.revealFolder).toHaveBeenCalledWith('documents');
		});

		test('refuses a folder that is not one of the six', () => {
			runCommand('/open --somewhere-else', handlers);

			expect(handlers.revealFolder).not.toHaveBeenCalled();
		});

		test('reveals a suite directory', () => {
			runCommand('/reveal --logs', handlers);

			expect(handlers.revealFolder).toHaveBeenCalledWith('logs');
		});

		test('defaults to the portable root', () => {
			runCommand('/reveal', handlers);

			expect(handlers.revealFolder).toHaveBeenCalledWith('root');
		});
	});

	describe('/config', () => {
		test('sets the theme', () => {
			runCommand('/config --theme dark', handlers);

			expect(handlers.setTheme).toHaveBeenCalledWith('dark');
		});

		test('sets the accent', () => {
			runCommand('/config --accent teal', handlers);

			expect(handlers.setAccent).toHaveBeenCalledWith('teal');
		});

		test('sets the density', () => {
			runCommand('/config --density compact', handlers);

			expect(handlers.setDensity).toHaveBeenCalledWith('compact');
		});

		test('sets more than one at a time', () => {
			runCommand('/config --theme light --density compact', handlers);

			expect(handlers.setTheme).toHaveBeenCalledWith('light');
			expect(handlers.setDensity).toHaveBeenCalledWith('compact');
		});

		test('ignores a value outside the closed set', () => {
			// The predictor only ever offers valid values, but a command can
			// also arrive by being typed out in full.
			runCommand('/config --theme neon', handlers);

			expect(handlers.setTheme).not.toHaveBeenCalled();
		});

		test('ignores a flag given without a value', () => {
			runCommand('/config --theme', handlers);

			expect(handlers.setTheme).not.toHaveBeenCalled();
		});
	});

	describe('/theme', () => {
		test('is the short form of /config --theme', () => {
			runCommand('/theme light', handlers);

			expect(handlers.setTheme).toHaveBeenCalledWith('light');
		});

		test('ignores a theme that does not exist', () => {
			runCommand('/theme neon', handlers);

			expect(handlers.setTheme).not.toHaveBeenCalled();
		});
	});

	describe('/pin', () => {
		test('pins the application it names', () => {
			runCommand('/pin terminal', handlers);

			expect(handlers.togglePin).toHaveBeenCalledWith('slate-terminal');
		});

		test('unpins through the same toggle', () => {
			runCommand('/unpin terminal', handlers);

			expect(handlers.togglePin).toHaveBeenCalledWith('slate-terminal');
		});

		test('does nothing when it names nothing', () => {
			runCommand('/pin', handlers);

			expect(handlers.togglePin).not.toHaveBeenCalled();
		});
	});

	describe('views', () => {
		test('/add opens the add view', () => {
			runCommand('/add', handlers);

			expect(handlers.openView).toHaveBeenCalledWith('add');
		});

		test('/help opens the reference', () => {
			runCommand('/help', handlers);

			expect(handlers.openView).toHaveBeenCalledWith('help');
		});

		test('/about opens the about view', () => {
			runCommand('/about', handlers);

			expect(handlers.openView).toHaveBeenCalledWith('about');
		});
	});

	test('/quit quits', () => {
		runCommand('/quit', handlers);

		expect(handlers.quit).toHaveBeenCalledTimes(1);
	});

	test('a command with nothing to do yet still clears the bar', () => {
		// `/find` is listed but unavailable. It was still chosen, so leaving the
		// text behind would be the bar refusing to acknowledge the press.
		runCommand('/find invoice', handlers);

		expect(handlers.setQuery).toHaveBeenCalledWith('');
	});

	test('an unknown command does nothing but clear', () => {
		runCommand('/nonsense', handlers);

		expect(handlers.setQuery).toHaveBeenCalledWith('');
		expect(handlers.launch).not.toHaveBeenCalled();
		expect(handlers.openView).not.toHaveBeenCalled();
		expect(handlers.quit).not.toHaveBeenCalled();
	});
});
