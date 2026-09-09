//! Starting a sibling application from the tray menu.
//!
//! Launcher-specific: Terminal and Explorer never start another application,
//! so this command exists only here rather than in the shared runtime. See
//! `.agents/architecture/module-map.md` for where a command like this belongs.

use launcher_core::LaunchPlan;
use slate_core::{AppId, KnownApp, SlateError};
use slate_process::Supervisor;
use slate_runtime::SlateState;
use tauri::Manager;

/// Starts Terminal or Explorer.
///
/// Runs the packaged executable in production, or that application's own
/// `bun run dev:<app>` script in a development checkout, which has no
/// packaged executable to run yet — see [`launcher_core::plan_launch`].
///
/// `app_id` is validated against the two applications the Launcher is
/// actually allowed to start, deliberately narrower than "any syntactically
/// valid [`AppId`]": nothing about the tray menu should be able to turn into
/// a way to launch the Launcher itself, or any other identifier a caller
/// might construct.
///
/// # Errors
///
/// Returns [`SlateError::InvalidInput`] for any application other than
/// Terminal or Explorer, and otherwise propagates
/// [`slate_process::ProcessError`] — most usefully
/// [`slate_process::ProcessError::AlreadyRunning`], since the application
/// this started stays tracked until it exits.
#[tauri::command]
pub fn slate_launcher_launch_app(app_id: AppId, app: tauri::AppHandle) -> Result<(), SlateError> {
    let launchable = [KnownApp::Terminal.id(), KnownApp::Explorer.id()];
    if !launchable.contains(&app_id) {
        return Err(SlateError::InvalidInput(format!(
            "the Launcher can only start Terminal or Explorer, not {app_id}"
        )));
    }

    let state = app.state::<SlateState>();
    let supervisor = app.state::<Supervisor>();
    let paths = state.paths();

    let plan = launcher_core::plan_launch(paths, &app_id, slate_paths::dev_repo_root().as_deref());

    match plan {
        LaunchPlan::Executable(_) => {
            supervisor.launch(paths, &app_id)?;
        }
        LaunchPlan::DevScript { repo_root, script } => {
            supervisor.launch_dev_script(&app_id, &repo_root, &script)?;
        }
    }

    Ok(())
}
