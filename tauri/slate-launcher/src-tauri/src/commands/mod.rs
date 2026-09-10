//! Commands specific to the Launcher.
//!
//! Everything shared with the other two applications lives in
//! `slate_runtime::commands` instead; what is here exists only because the
//! Launcher is the one application that starts another, reveals the suite's
//! own directories, and grows its window to hold a view.

// Tauri resolves command arguments by type, so a command must take an owned
// `State` even when it only reads from it. The lint is right in general and
// wrong for this module.
#[allow(clippy::needless_pass_by_value)]
pub mod launch;
#[allow(clippy::needless_pass_by_value)]
pub mod reveal;
#[allow(clippy::needless_pass_by_value)]
pub mod window;

pub use launch::slate_launcher_launch_app;
pub use reveal::slate_launcher_reveal;
pub use window::slate_launcher_set_expanded;
