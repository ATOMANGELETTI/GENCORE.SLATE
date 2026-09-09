/**
 * `@slate/bindings` — the IPC contract between Rust and TypeScript.
 *
 * These types mirror the Rust definitions in `slate-runtime` and `slate-core`.
 * They are hand-authored rather than generated: `tauri-specta` is still a
 * release candidate, and a pre-release dependency at the base of the graph
 * would propagate its breaking changes across every crate and application.
 * ADR 0008 records that decision and the condition for revisiting it.
 *
 * **This is the only place these shapes are declared.** Redeclaring one
 * locally is how the two sides drift, and a drift here fails at runtime with
 * an `undefined`, not at compile time — the hardest bug in this codebase to
 * track down.
 *
 * The Rust side has a test asserting that every registered command appears in
 * `COMMANDS` below, so a command added without a contract entry fails CI.
 */

// ── Errors ───────────────────────────────────────────────────────────────────

/** Mirrors `slate_core::SlateError`. The `kind` tag is the stable contract. */
export type SlateErrorKind =
	| 'paths'
	| 'config'
	| 'database'
	| 'ipc'
	| 'process'
	| 'notFound'
	| 'invalidInput'
	| 'internal';

/** An error returned by any Tauri command. */
export type SlateError = {
	kind: SlateErrorKind;
	message: string;
};

/** Whether an unknown value is a `SlateError` from the backend. */
export function isSlateError(value: unknown): value is SlateError {
	return (
		typeof value === 'object' &&
		value !== null &&
		'kind' in value &&
		'message' in value &&
		typeof (value as { message: unknown }).message === 'string'
	);
}

// ── Configuration ────────────────────────────────────────────────────────────

/** Mirrors `slate_config::ThemeMode`. */
export type ThemeMode = 'system' | 'light' | 'dark';

/** Mirrors `slate_config::WindowMaterial`. */
export type WindowMaterial = 'solid' | 'mica' | 'acrylic';

/** Mirrors `slate_config::SuiteConfig`. */
export type SuiteConfig = {
	theme: ThemeMode;
	material: WindowMaterial;
	'use-system-accent': boolean;
	'reduce-motion': boolean;
	'log-level': string;
	'log-retention-days': number;
};

/** Mirrors `slate_config::WindowConfig`. */
export type WindowGeometry = {
	width: number;
	height: number;
	x: number | null;
	y: number | null;
	maximized: boolean;
};

/** Mirrors `slate_config::AppConfig`. */
export type AppConfig = {
	window: WindowGeometry;
	theme: ThemeMode | null;
};

/** Mirrors `slate_config::ResolvedConfig`. */
export type ResolvedConfig = {
	suite: SuiteConfig;
	app: AppConfig;
};

// ── Window and runtime ───────────────────────────────────────────────────────

/**
 * Mirrors `slate_runtime::commands::window::WindowVisibility`.
 *
 * One value rather than three booleans, because the three are not independent:
 * a window cannot be hidden and visible at once, and a union makes that
 * combination unrepresentable on both sides of the boundary.
 */
export type WindowVisibility = 'visible' | 'minimized' | 'hidden';

/** Mirrors `slate_runtime::commands::window::WindowState`. */
export type WindowState = {
	isMaximized: boolean;
	isFocused: boolean;
	/**
	 * Closing hides to the tray rather than exiting, so `'hidden'` is a normal
	 * resting state rather than a window on its way out.
	 */
	visibility: WindowVisibility;
	isAlwaysOnTop: boolean;
};

/**
 * Mirrors `slate_runtime::commands::runtime::RuntimeInfo`.
 *
 * Note the absence of any absolute path: the frontend has no legitimate use
 * for one, and exposing it only creates a way for a user's directory layout to
 * leak into a log or a screenshot.
 */
export type RuntimeInfo = {
	appId: string;
	suiteVersion: string;
	protocolVersion: number;
	installFingerprint: string;
	config: ResolvedConfig;
	theme: Exclude<ThemeMode, 'system'> | 'system';
};

// ── Command surface ──────────────────────────────────────────────────────────

/**
 * Every command the shared runtime registers, with its argument and return
 * types. `@slate/ipc` uses this to make `invoke` type-safe by name.
 */
export type SlateCommands = {
	slate_window_state: { args: undefined; returns: WindowState };
	slate_window_minimize: { args: undefined; returns: undefined };
	slate_window_toggle_maximize: { args: undefined; returns: boolean };
	slate_window_close: { args: undefined; returns: undefined };
	slate_window_hide: { args: undefined; returns: undefined };
	slate_window_show: { args: undefined; returns: undefined };
	slate_window_set_always_on_top: { args: { isEnabled: boolean }; returns: boolean };
	slate_window_start_drag: { args: undefined; returns: undefined };
	slate_window_persist_geometry: { args: undefined; returns: undefined };
	slate_runtime_info: { args: undefined; returns: RuntimeInfo };
	slate_set_theme: { args: { theme: ThemeMode }; returns: undefined };
	slate_reload_config: { args: undefined; returns: ResolvedConfig };
	/** Reveals the application's own config TOML in the system file explorer.
	 *  Stands in for a Preferences window that does not exist yet. */
	slate_open_config_file: { args: undefined; returns: undefined };
	/** Reports the size the tray menu's content needs, in logical pixels. */
	slate_tray_menu_ready: { args: { width: number; height: number }; returns: undefined };
	slate_tray_menu_dismiss: { args: undefined; returns: undefined };
	slate_tray_show_main_window: { args: undefined; returns: undefined };
	slate_tray_hide_main_window: { args: undefined; returns: undefined };
	slate_tray_main_window_is_visible: { args: undefined; returns: boolean };
	slate_tray_quit: { args: undefined; returns: undefined };
};

/** The name of any shared command. */
export type SlateCommandName = keyof SlateCommands;

/**
 * The shared command names as data.
 *
 * Kept in step with `slate_runtime::shared_command_names()` by a Rust test —
 * see ADR 0008 for why this mitigation exists in place of generation.
 */
export const COMMANDS = [
	'slate_window_state',
	'slate_window_minimize',
	'slate_window_toggle_maximize',
	'slate_window_close',
	'slate_window_hide',
	'slate_window_show',
	'slate_window_set_always_on_top',
	'slate_window_start_drag',
	'slate_window_persist_geometry',
	'slate_runtime_info',
	'slate_set_theme',
	'slate_reload_config',
	'slate_open_config_file',
	'slate_tray_menu_ready',
	'slate_tray_menu_dismiss',
	'slate_tray_show_main_window',
	'slate_tray_hide_main_window',
	'slate_tray_main_window_is_visible',
	'slate_tray_quit',
] as const satisfies readonly SlateCommandName[];

/** Tauri event names the runtime emits. */
export const EVENTS = {
	/** Window focus, size, or state changed. */
	windowState: 'slate://window-state',
	/** Configuration was reloaded and the frontend should re-read it. */
	configChanged: 'slate://config-changed',
} as const;
