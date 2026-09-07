//! The shared Tauri shell for every SLATE application.
//!
//! This crate is what makes three separate binaries feel like one product. It
//! owns the portable bootstrap, logging, window chrome, and the commands the
//! custom title bar depends on — so an application's own `src-tauri` contains
//! only what is genuinely specific to it.
//!
//! A complete application backend looks like this:
//!
//! ```ignore
//! pub fn run() {
//!     // Must be first: WebView2 reads its environment when the first
//!     // webview is created (ADR 0005).
//!     let state = slate_runtime::bootstrap(KnownApp::Terminal.id())
//!         .expect("the portable environment could not be prepared");
//!
//!     tauri::Builder::default()
//!         .manage(state)
//!         .invoke_handler(tauri::generate_handler![/* shared + local commands */])
//!         .setup(slate_runtime::setup)
//!         .run(tauri::generate_context!())
//!         .expect("the application failed to start");
//! }
//! ```
//!
//! See `.agents/rules/08-tauri-and-security.md` for the rules every command
//! must follow, and ADR 0010 for the chrome this crate applies.

pub mod bootstrap;
pub mod commands;
pub mod error;
pub mod logging;
pub mod state;
pub mod window;

pub use bootstrap::bootstrap;
pub use error::RuntimeError;
pub use state::SlateState;
pub use window::apply_chrome;

use tauri::Manager;

/// The label every application gives its main window.
///
/// Shared so that `app.get_webview_window(MAIN_WINDOW)` works identically
/// everywhere, including from this crate.
pub const MAIN_WINDOW: &str = "main";

/// The commands every application must register.
///
/// Exposed as data so an application's test suite can assert that none was
/// forgotten — a missing chrome command produces a title bar whose buttons do
/// nothing, which is easy to ship and embarrassing to discover.
pub fn shared_command_names() -> &'static [&'static str] {
    &[
        "slate_window_state",
        "slate_window_minimize",
        "slate_window_toggle_maximize",
        "slate_window_close",
        "slate_window_start_drag",
        "slate_window_persist_geometry",
        "slate_runtime_info",
        "slate_set_theme",
        "slate_reload_config",
    ]
}

/// The `setup` hook every application passes to the Tauri builder.
///
/// Creates the main window and applies the suite's chrome to it.
///
/// # Why the window is built here rather than in `tauri.conf.json`
///
/// A window declared in configuration is created by Tauri with a **default
/// data directory**, which Tauri resolves to `%LOCALAPPDATA%\<bundle id>` and
/// creates eagerly — outside the portable root, before any of our code runs.
/// Setting `WEBVIEW2_USER_DATA_FOLDER` redirects the browser profile
/// correctly, but the empty directory is still left behind on the host, and
/// "writes nothing outside its own folder" has to mean nothing at all.
///
/// Building the window here lets [`tauri::webview::WebviewWindowBuilder::data_directory`]
/// be set explicitly, so Tauri never resolves an OS-owned path in the first
/// place. It also puts the window definition in one place for all three
/// applications, which is what keeps them identical.
///
/// # Errors
///
/// Returns an error if the window cannot be created or the chrome cannot be
/// applied.
pub fn setup(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let state = app.state::<SlateState>();
    let config = state.config();
    let title = app
        .config()
        .product_name
        .clone()
        .unwrap_or_else(|| "SLATE".to_owned());
    let data_directory = state.paths().webview2_user_data_dir(state.app_id());
    let geometry = &config.app.window;

    let window = tauri::WebviewWindowBuilder::new(app, MAIN_WINDOW, tauri::WebviewUrl::default())
        .title(title)
        .data_directory(data_directory.into_std_path_buf())
        .inner_size(geometry.width, geometry.height)
        .min_inner_size(480.0, 360.0)
        .resizable(true)
        // The suite draws its own title bar (ADR 0010).
        .decorations(false)
        // Required for Mica and Acrylic, and for the rounded corners the
        // stylesheet draws.
        .transparent(true)
        .shadow(true)
        // Shown by `apply_chrome` once it is positioned, so the window does not
        // visibly jump to its remembered place.
        .visible(false)
        .build()?;

    apply_chrome(&window, &config)?;

    Ok(())
}
