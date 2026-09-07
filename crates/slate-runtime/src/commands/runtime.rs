//! Commands describing the running suite.

use slate_config::{ResolvedConfig, ThemeMode};
use slate_core::SlateError;
use tauri::Manager;

use crate::state::SlateState;

/// What the frontend is told about its own environment at startup.
///
/// Note what is absent: no absolute paths. The frontend has no legitimate use
/// for them, and putting them in the webview would only create a way for them
/// to be echoed into a log, a screenshot, or an error report.
#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeInfo {
    /// The application's identifier.
    pub app_id: String,
    /// The suite version.
    pub suite_version: String,
    /// The IPC protocol version this build speaks.
    pub protocol_version: u16,
    /// The short fingerprint of the portable root, for support and logs.
    pub install_fingerprint: String,
    /// The resolved configuration.
    pub config: ResolvedConfig,
    /// The theme the window should render in.
    pub theme: ThemeMode,
}

/// Describes the running application to its frontend.
///
/// # Errors
///
/// Infallible today; returns `Result` so that adding a fallible field later is
/// not a breaking change to the frontend contract.
// Returns Result deliberately: the frontend contract should not change shape
// the first time this needs to report a failure.
#[allow(clippy::unnecessary_wraps)]
#[tauri::command]
pub fn slate_runtime_info(app: tauri::AppHandle) -> Result<RuntimeInfo, SlateError> {
    let state = app.state::<SlateState>();
    let config = state.config();

    Ok(RuntimeInfo {
        app_id: state.app_id().to_string(),
        suite_version: slate_core::version::SUITE_VERSION.to_owned(),
        protocol_version: slate_core::PROTOCOL_VERSION,
        install_fingerprint: slate_ipc_fingerprint(state.paths().root()),
        theme: config.effective_theme(),
        config,
    })
}

/// Changes this application's theme and persists it.
///
/// # Errors
///
/// Returns [`SlateError::Config`] if the setting cannot be written.
#[tauri::command]
pub fn slate_set_theme(app: tauri::AppHandle, theme: ThemeMode) -> Result<(), SlateError> {
    let state = app.state::<SlateState>();
    state.update_config(|config| config.theme = Some(theme))?;
    Ok(())
}

/// Re-reads configuration from disk.
///
/// Called when the broker announces that a setting changed in another window.
///
/// # Errors
///
/// Returns [`SlateError::Config`] if the files on disk are malformed.
#[tauri::command]
pub fn slate_reload_config(app: tauri::AppHandle) -> Result<ResolvedConfig, SlateError> {
    let state = app.state::<SlateState>();
    state.reload_config()?;
    Ok(state.config())
}

/// A short, non-identifying fingerprint of the install.
///
/// Duplicated from `slate-ipc` rather than depending on it: the runtime does
/// not otherwise need the IPC crate, and one small hash is a cheaper price
/// than a dependency edge that exists for a single function.
fn slate_ipc_fingerprint(root: &camino::Utf8Path) -> String {
    use std::hash::{DefaultHasher, Hash, Hasher};

    let normalised = root
        .as_str()
        .replace('/', "\\")
        .trim_end_matches('\\')
        .to_lowercase();
    let mut hasher = DefaultHasher::new();
    normalised.hash(&mut hasher);

    format!("{:016x}", hasher.finish())
}
