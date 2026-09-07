//! Starting and supervising child applications.

use std::collections::HashMap;
use std::process::{Child, Command, Stdio};

use camino::Utf8Path;
use parking_lot::Mutex;
use serde::Serialize;
use slate_core::AppId;
use slate_paths::{ENV_INSTALL_DIR, SlatePaths};

use crate::error::ProcessError;

/// A child application the Launcher started.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RunningProcess {
    /// Which application it is.
    pub app: AppId,
    /// Its process id.
    pub pid: u32,
}

/// Starts and tracks the applications the Launcher owns.
#[derive(Debug, Default)]
pub struct Supervisor {
    children: Mutex<HashMap<AppId, Child>>,
}

impl Supervisor {
    /// Creates an empty supervisor.
    pub fn new() -> Self {
        Self::default()
    }

    /// Launches an application from the portable tree.
    ///
    /// The child inherits `SLATE_INSTALL_DIR`, which is what lets it skip
    /// discovery entirely and guarantees every application in a session agrees
    /// on the same portable root. Forgetting this is the classic way a child
    /// re-discovers and picks a *different* root — see
    /// `.agents/workflows/debug-portability.md`.
    ///
    /// # Errors
    ///
    /// Returns [`ProcessError::NotFound`] if the executable is missing —
    /// normal for a partially extracted install — [`ProcessError::AlreadyRunning`]
    /// if the application is already up, or [`ProcessError::Spawn`] if Windows
    /// refuses to start it.
    pub fn launch(&self, paths: &SlatePaths, app: &AppId) -> Result<RunningProcess, ProcessError> {
        self.reap();

        if self.children.lock().contains_key(app) {
            return Err(ProcessError::AlreadyRunning {
                app: app.to_string(),
            });
        }

        let executable = paths.app_executable(app);
        if !executable.is_file() {
            return Err(ProcessError::NotFound {
                path: executable.to_string(),
            });
        }

        let child = Command::new(executable.as_std_path())
            .env(ENV_INSTALL_DIR, paths.root().as_str())
            // Working directory is set to the application's own folder so a
            // relative path a child resolves can never reach outside the tree.
            .current_dir(working_directory(&executable))
            // The child logs to appdata/logs; inheriting stdio would attach it
            // to whatever console the Launcher happens to have.
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .map_err(|error| ProcessError::Spawn {
                app: app.to_string(),
                reason: error.to_string(),
            })?;

        let pid = child.id();
        self.children.lock().insert(app.clone(), child);

        tracing::info!(app = %app, pid, "launched application");

        Ok(RunningProcess {
            app: app.clone(),
            pid,
        })
    }

    /// The applications this supervisor started that are still running.
    pub fn running(&self) -> Vec<RunningProcess> {
        self.reap();

        self.children
            .lock()
            .iter()
            .map(|(app, child)| RunningProcess {
                app: app.clone(),
                pid: child.id(),
            })
            .collect()
    }

    /// Whether an application started by this supervisor is still running.
    pub fn is_running(&self, app: &AppId) -> bool {
        self.reap();
        self.children.lock().contains_key(app)
    }

    /// Forgets children that have exited.
    ///
    /// Called before every query rather than on a timer: a Windows process
    /// that has exited but is never waited on stays a zombie holding its
    /// handle, and a launcher left open for days would accumulate them.
    fn reap(&self) {
        self.children
            .lock()
            .retain(|app, child| match child.try_wait() {
                Ok(Some(status)) => {
                    tracing::info!(app = %app, code = status.code(), "application exited");
                    false
                }
                Ok(None) => true,
                Err(error) => {
                    tracing::warn!(app = %app, %error, "could not check the child process");
                    false
                }
            });
    }
}

/// The directory an application should run in.
fn working_directory(executable: &Utf8Path) -> &Utf8Path {
    executable.parent().unwrap_or(executable)
}
