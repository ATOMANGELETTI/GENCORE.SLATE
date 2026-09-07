//! Portable bootstrap.
//!
//! Everything that must happen before a window exists.

use slate_config::ConfigStore;
use slate_core::AppId;
use slate_paths::SlatePaths;

use crate::error::RuntimeError;
use crate::logging;
use crate::state::SlateState;

/// Points WebView2 at the bundled runtime and a per-application user-data
/// folder, then resolves paths, repairs the layout, seeds configuration, and
/// starts logging.
///
/// **Call this as the first statement in `main`, before any Tauri builder
/// runs.** WebView2 reads its environment when the first webview is created;
/// setting these variables afterwards silently has no effect, and the app
/// writes its browser profile outside the portable root — the exact failure
/// this whole architecture exists to prevent. See ADR 0005.
///
/// # Errors
///
/// Returns [`RuntimeError::Paths`] if the portable root cannot be found or
/// repaired, or [`RuntimeError::Config`] if configuration is malformed.
pub fn bootstrap(app_id: AppId) -> Result<SlateState, RuntimeError> {
    // Every application ships with the "windows" subsystem in every build
    // profile, so it never has a console by default — see each app's
    // main.rs. This is the only way back into one, and it must run before
    // `logging::init` below: a "windows" subsystem process starts with no
    // console at all, so a tracing layer writing to stdout before one is
    // attached goes nowhere.
    #[cfg(windows)]
    attach_console_if_requested();

    let paths = SlatePaths::discover()?;
    paths.ensure_layout()?;

    configure_webview2(&paths, &app_id);

    ConfigStore::seed_defaults(&paths, &app_id)?;
    let config = ConfigStore::load(&paths, &app_id)?;

    logging::init(&paths, &app_id, &config.resolved().suite)?;

    tracing::info!(
        app = %app_id,
        root = %paths.root(),
        version = %slate_core::version::SUITE_VERSION,
        "slate runtime started",
    );

    Ok(SlateState::new(app_id, paths, config))
}

/// Sets the two environment variables that keep WebView2 inside the portable
/// root.
///
/// `WEBVIEW2_BROWSER_EXECUTABLE_FOLDER` is only set when the bundled runtime is
/// actually present. A development tree usually has no runtime bundled, and
/// pointing WebView2 at an empty directory prevents any window from opening at
/// all — so in that case the system runtime is used and a warning is logged.
fn configure_webview2(paths: &SlatePaths, app_id: &AppId) {
    let user_data = paths.webview2_user_data_dir(app_id);
    let runtime = paths.webview2_runtime_dir();

    // SAFETY: this runs as the first statement in `main`, before any thread is
    // spawned and before Tauri creates a webview, so nothing can be reading
    // the environment concurrently. `std::env::set_var` is unsafe in the 2024
    // edition solely because of that race.
    #[allow(unsafe_code)]
    unsafe {
        std::env::set_var("WEBVIEW2_USER_DATA_FOLDER", user_data.as_str());

        if runtime.join("msedgewebview2.exe").is_file() {
            std::env::set_var("WEBVIEW2_BROWSER_EXECUTABLE_FOLDER", runtime.as_str());
        }
    }
}

/// Attaches a console to this process if `SLATE_LOG_CONSOLE` asks for one.
///
/// Every application is compiled with the "windows" subsystem, in every build
/// profile, so a debug package behaves exactly like a shipped one and never
/// pops a console window by surprise. Requesting console output is a runtime
/// choice: set [`logging::ENV_LOG_CONSOLE`] and this attaches a real console
/// before anything is logged, so `println!`/`tracing`'s console layer have
/// somewhere to write.
///
/// Safe to call when a console already exists (e.g. launched from a terminal);
/// `AllocConsole` simply fails in that case and this proceeds without one.
///
/// Whether a console *window* actually becomes visible is ultimately up to
/// Windows' registered default terminal application, not this call — on a
/// machine with Windows Terminal set as the default, `AllocConsole` hands the
/// new console to it. [`logging::init`]'s file layer writes to
/// `appdata/logs/` unconditionally regardless of whether a console is visible
/// or attaches at all, so it — not this — is the reliable place to look.
#[cfg(windows)]
fn attach_console_if_requested() {
    let wants_console =
        std::env::var(logging::ENV_LOG_CONSOLE).is_ok_and(|value| !value.is_empty());

    if !wants_console {
        return;
    }

    // SAFETY: called once, as the first statement in `bootstrap`, before any
    // thread is spawned and before stdio is used for logging.
    #[allow(unsafe_code)]
    unsafe {
        let _ = windows_sys::Win32::System::Console::AllocConsole();
    }
}
