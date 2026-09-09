//! Standing in for a Preferences window that does not exist yet.
//!
//! There is no Preferences UI in the suite today, and none is planned in the
//! near term. Leaving the menu item permanently disabled — as it was before
//! this module existed — is a dead end users hit and then ignore. Revealing
//! the app's own config file is a genuinely useful thing to offer instead: it
//! is the same file Preferences would eventually edit, and a user comfortable
//! hand-editing TOML already can, today, without waiting on that window.

use slate_core::SlateError;
use tauri::Manager;
use tauri_plugin_opener::OpenerExt;

use crate::state::SlateState;

/// Reveals the application's configuration file in the system file explorer.
///
/// The path is resolved here, from [`SlateState`], rather than accepted as an
/// argument — the frontend has no legitimate reason to know an absolute path
/// (see [`crate::commands::runtime::RuntimeInfo`]'s doc comment), and a
/// command that took one would be a way for the frontend to ask Explorer to
/// open anywhere on disk, not just its own config file.
///
/// # Errors
///
/// Returns [`SlateError::Internal`] if the file explorer could not be asked to
/// show the path — for instance, if the platform's opener is unavailable.
#[tauri::command]
pub fn slate_open_config_file(app: tauri::AppHandle) -> Result<(), SlateError> {
    let state = app.state::<SlateState>();
    let path = state.paths().config_file(state.app_id());

    app.opener()
        .reveal_item_in_dir(path.as_std_path())
        .map_err(|error| SlateError::Internal(error.to_string()))
}
