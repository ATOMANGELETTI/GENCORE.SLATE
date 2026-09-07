//! `Slate.exe` — the portable root's entry point.
//!
//! Sits at the top of the extracted zip so the suite starts the way a user
//! expects: unzip anywhere, double-click one file. All it does is find the
//! Launcher inside the tree and start it.
//!
//! Kept as a separate, tiny binary rather than putting the Launcher itself at
//! the root: the Launcher belongs in `programs/gencore/slate/` with everything
//! else it owns, and a root full of application files is exactly the mess this
//! layout exists to avoid.

// No console window: this is a launcher, not a command-line tool.
#![windows_subsystem = "windows"]

use std::process::Command;

use slate_paths::{ENV_INSTALL_DIR, SlatePaths};

fn main() -> std::process::ExitCode {
    let paths = match SlatePaths::discover() {
        Ok(paths) => paths,
        Err(error) => return fail(&format!("The SLATE install could not be found.\n\n{error}")),
    };

    let launcher = paths.app_executable(&slate_core::KnownApp::Launcher.id());
    if !launcher.is_file() {
        return fail(&format!(
            "The Launcher is missing from this install.\n\nExpected it at:\n{launcher}\n\n\
             The archive may not have extracted completely."
        ));
    }

    // The child inherits the resolved root, so it does not repeat discovery
    // and cannot disagree with this process about where the install is.
    match Command::new(launcher.as_std_path())
        .env(ENV_INSTALL_DIR, paths.root().as_str())
        .current_dir(launcher.parent().unwrap_or(&launcher).as_std_path())
        .spawn()
    {
        Ok(_) => std::process::ExitCode::SUCCESS,
        Err(error) => fail(&format!("The Launcher could not be started.\n\n{error}")),
    }
}

/// Reports a startup failure and exits.
///
/// The shim has no window and no logging of its own — logging lives inside the
/// portable root, which is the very thing that could not be found — so the
/// message goes to stderr, where it is visible to anyone who runs the shim
/// from a terminal to find out why nothing happened.
#[allow(clippy::print_stderr)]
fn fail(message: &str) -> std::process::ExitCode {
    eprintln!("SLATE could not start.\n\n{message}");
    std::process::ExitCode::FAILURE
}
