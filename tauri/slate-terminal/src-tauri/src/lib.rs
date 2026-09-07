//! The Terminal application backend.
//!
//! Almost everything lives in `slate-runtime`: the portable bootstrap, window
//! chrome, logging, and the commands the custom title bar needs. What remains
//! here is only what is specific to Terminal, which is what keeps the three
//! applications consistent as they grow apart.

use slate_core::KnownApp;

/// Starts the application.
///
/// # Panics
///
/// Panics if the portable environment cannot be prepared or Tauri cannot
/// start. Both mean the application cannot run at all — there is no degraded
/// mode in which a window exists but has nowhere to write — so failing loudly
/// with the reason beats a window that silently misbehaves.
// Failing loudly is the intended behaviour, and is documented above: there
// is no degraded mode in which a window exists but has nowhere to write.
#[allow(clippy::expect_used)]
pub fn run() {
    // Must be first: WebView2 reads its environment when the first webview is
    // created, so setting it later silently has no effect (ADR 0005).
    let state = slate_runtime::bootstrap(KnownApp::Terminal.id())
        .expect("the portable environment could not be prepared");

    tauri::Builder::default()
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            slate_runtime::commands::window::slate_window_state,
            slate_runtime::commands::window::slate_window_minimize,
            slate_runtime::commands::window::slate_window_toggle_maximize,
            slate_runtime::commands::window::slate_window_close,
            slate_runtime::commands::window::slate_window_start_drag,
            slate_runtime::commands::window::slate_window_persist_geometry,
            slate_runtime::commands::runtime::slate_runtime_info,
            slate_runtime::commands::runtime::slate_set_theme,
            slate_runtime::commands::runtime::slate_reload_config,
        ])
        .setup(slate_runtime::setup)
        .run(tauri::generate_context!())
        .expect("the application failed to start");
}
