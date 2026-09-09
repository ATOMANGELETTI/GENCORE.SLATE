/**
 * `@slate/ipc` — the typed bridge between an application's frontend and its
 * Rust backend.
 *
 * Applications call commands through [`invoke`] rather than Tauri's directly,
 * so a command name is checked at compile time and a Rust `Err` arrives as a
 * predictable `SlateError` instead of an arbitrary rejected value.
 *
 * This package depends on Tauri; `@slate/ui-kit` deliberately does not. That
 * split is what lets the whole component kit render in an ordinary browser for
 * the gallery.
 */

export { type RuntimeInfoState, setTheme, useRuntimeInfo } from './hooks/use-runtime-info.hook.ts';
export { type TrayMenu, useTrayMenu } from './hooks/use-tray-menu.hook.ts';
export { useWebviewZoom, type WebviewZoom } from './hooks/use-webview-zoom.hook.ts';
export { useWindowChrome, type WindowChrome } from './hooks/use-window-chrome.hook.ts';
export { invoke, invokeAppCommand, isDesktop, toSlateError } from './invoke/command.service.ts';
