//! Showing one of the suite's own directories in the system file explorer.

use slate_core::SlateError;
use slate_paths::StorageKind;
use slate_runtime::SlateState;
use tauri::Manager;
use tauri_plugin_opener::OpenerExt;

/// A directory the Launcher is allowed to reveal.
///
/// **A closed set, not a path.** This is the same decision
/// [`slate_runtime::commands::preferences::slate_open_config_file`] documents:
/// a command that accepted a path string would be a way for the webview to ask
/// Explorer to open anywhere on disk, and the frontend has no legitimate reason
/// to know an absolute path in the first place. An enum cannot be pointed
/// somewhere it was not built to go, and an unknown value fails deserialisation
/// before the command body ever runs.
///
/// The six storage variants mirror [`StorageKind`] exactly, so the Launcher's
/// folder list and the Explorer's cannot drift apart.
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum RevealTarget {
    /// `storage/desktop`
    Desktop,
    /// `storage/documents`
    Documents,
    /// `storage/downloads`
    Downloads,
    /// `storage/music`
    Music,
    /// `storage/pictures`
    Pictures,
    /// `storage/videos`
    Videos,
    /// The portable root itself.
    Root,
    /// The directory holding the suite's TOML configuration.
    Config,
    /// The rolling log directory.
    Logs,
}

impl RevealTarget {
    /// Resolves the target to a real path.
    ///
    /// Exhaustive with no wildcard arm, deliberately: a variant added later
    /// has to be given a path here rather than silently falling through to the
    /// portable root.
    fn resolve(self, paths: &slate_paths::SlatePaths) -> camino::Utf8PathBuf {
        match self {
            Self::Desktop => paths.storage(StorageKind::Desktop),
            Self::Documents => paths.storage(StorageKind::Documents),
            Self::Downloads => paths.storage(StorageKind::Downloads),
            Self::Music => paths.storage(StorageKind::Music),
            Self::Pictures => paths.storage(StorageKind::Pictures),
            Self::Videos => paths.storage(StorageKind::Videos),
            Self::Root => paths.root().to_owned(),
            Self::Config => paths.config_dir(),
            Self::Logs => paths.logs_dir(),
        }
    }
}

/// Reveals one of the suite's directories in the system file explorer.
///
/// Every path is derived from [`slate_paths::SlatePaths`], never assembled from
/// the argument — the argument only chooses which of a fixed set to ask for.
///
/// # Errors
///
/// Returns [`SlateError::Internal`] if the file explorer could not be asked to
/// show the path, for instance if the platform's opener is unavailable.
#[tauri::command]
pub fn slate_launcher_reveal(
    app: tauri::AppHandle,
    target: RevealTarget,
) -> Result<(), SlateError> {
    let state = app.state::<SlateState>();
    let path = target.resolve(state.paths());

    app.opener()
        .reveal_item_in_dir(path.as_std_path())
        .map_err(|error| SlateError::Internal(error.to_string()))
}
