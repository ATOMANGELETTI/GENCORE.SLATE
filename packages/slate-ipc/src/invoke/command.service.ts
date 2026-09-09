import {
	isSlateError,
	type SlateCommandName,
	type SlateCommands,
	type SlateError,
} from '@slate/bindings';
import { invoke as tauriInvoke } from '@tauri-apps/api/core';

/**
 * A typed wrapper around Tauri's `invoke`.
 *
 * Two things it buys over calling `invoke` directly:
 *
 * 1. The command name is checked against the contract, so a typo is a compile
 *    error rather than a rejected promise at runtime.
 * 2. Rust's `Err` variant arrives as a rejected promise carrying an arbitrary
 *    value. This normalises it into a `SlateError` so callers never have to
 *    guess what they caught.
 */
export async function invoke<Name extends SlateCommandName>(
	...[command, args]: SlateCommands[Name]['args'] extends undefined
		? [command: Name]
		: [command: Name, args: SlateCommands[Name]['args']]
): Promise<SlateCommands[Name]['returns']> {
	try {
		return (await tauriInvoke(command, args ?? undefined)) as SlateCommands[Name]['returns'];
	} catch (cause) {
		throw toSlateError(cause, command);
	}
}

/**
 * Invokes a command that is not part of the shared contract in
 * `@slate/bindings` — one specific to a single application, registered only
 * in that application's own `invoke_handler!`.
 *
 * This is the escape hatch `invoke` deliberately does not offer: adding an
 * application-specific command to the shared contract would force every
 * other application to register it too, just to satisfy the contract test —
 * see `.agents/architecture/module-map.md` for where such a command belongs
 * instead. Error handling is identical to `invoke`; only the compile-time name
 * check is gone, since there is no shared contract to check it against.
 */
export async function invokeAppCommand<T>(
	command: string,
	args?: Record<string, unknown>,
): Promise<T> {
	try {
		return (await tauriInvoke(command, args)) as T;
	} catch (cause) {
		throw toSlateError(cause, command);
	}
}

/** Normalises anything thrown by the IPC layer into a `SlateError`. */
export function toSlateError(cause: unknown, command?: string): SlateError {
	if (isSlateError(cause)) {
		return cause;
	}

	const suffix = command ? ` (${command})` : '';

	return {
		kind: 'internal',
		message: cause instanceof Error ? `${cause.message}${suffix}` : `${String(cause)}${suffix}`,
	};
}

/**
 * Whether the code is running inside a Tauri webview.
 *
 * The UI kit's gallery renders the same components in an ordinary browser, so
 * anything touching the desktop has to be able to ask.
 */
export function isDesktop(): boolean {
	return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}
