//! Tauri commands shared by every application.
//!
//! Each application registers these alongside its own, so window chrome and
//! runtime information behave identically across the suite:
//!
//! ```ignore
//! tauri::Builder::default()
//!     .invoke_handler(tauri::generate_handler![
//!         slate_runtime::commands::window::slate_window_state,
//!         // …
//!     ])
//! ```
//!
//! Use [`crate::shared_command_names`] in a test to assert that an application
//! has not forgotten one.

// Tauri resolves command arguments by type, so a command must take an owned
// `AppHandle` or `WebviewWindow` even when it only reads from it. The lint is
// right in general and wrong for every function in these two modules.
#[allow(clippy::needless_pass_by_value)]
pub mod runtime;
#[allow(clippy::needless_pass_by_value)]
pub mod window;

pub use runtime::{RuntimeInfo, slate_reload_config, slate_runtime_info, slate_set_theme};
pub use window::{
    WindowState, slate_window_close, slate_window_minimize, slate_window_persist_geometry,
    slate_window_start_drag, slate_window_state, slate_window_toggle_maximize,
};
