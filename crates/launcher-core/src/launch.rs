//! Deciding how to start one of the suite's own sibling applications.
//!
//! This is the "what to launch" half of starting an application — the
//! mechanical "how" (actually spawning it, tracking the child, injecting the
//! portable environment) is `slate-process`'s job; see that crate's own
//! documentation for why the split exists.

use camino::{Utf8Path, Utf8PathBuf};
use slate_core::AppId;
use slate_paths::SlatePaths;

/// How the Launcher should start one of its sibling applications.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LaunchPlan {
    /// Run the packaged executable directly — the ordinary, production case.
    Executable(Utf8PathBuf),
    /// Run through `bun run`, in a development checkout that has no packaged
    /// executable to run yet.
    DevScript {
        /// The repository root — `bun run` only means something from there.
        repo_root: Utf8PathBuf,
        /// The root `package.json` script to run, e.g. `dev:terminal`.
        script: String,
    },
}

/// Decides how `app` should be started.
///
/// `dev_repo_root` is the caller's own [`slate_paths::dev_repo_root`] —
/// accepted as a parameter rather than read here so this stays a pure
/// function of its inputs, with nothing to fake in a test to reach either
/// branch. Its presence *is* the decision: a debug build started through
/// `scripts/bun-dev.ts` has one, a release build never does, and a debug
/// build started any other way has nothing to fall back to either — see that
/// function's own documentation.
pub fn plan_launch(
    paths: &SlatePaths,
    app: &AppId,
    dev_repo_root: Option<&Utf8Path>,
) -> LaunchPlan {
    if let Some(repo_root) = dev_repo_root {
        return LaunchPlan::DevScript {
            repo_root: repo_root.to_owned(),
            script: dev_script_name(app),
        };
    }

    LaunchPlan::Executable(paths.app_executable(app))
}

/// The root `package.json` script that starts `app` in development —
/// `dev:terminal`, `dev:explorer`, mirroring the scripts declared there.
fn dev_script_name(app: &AppId) -> String {
    format!("dev:{}", app.as_str().trim_start_matches("slate-"))
}
