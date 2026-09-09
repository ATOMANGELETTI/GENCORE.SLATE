//! Commands specific to the Launcher.
//!
//! Everything shared with the other two applications lives in
//! `slate_runtime::commands` instead; what is here exists only because the
//! Launcher is the one application that starts another.

// Tauri resolves command arguments by type, so a command must take an owned
// `State` even when it only reads from it. The lint is right in general and
// wrong for this module.
#[allow(clippy::needless_pass_by_value)]
pub mod launch;

pub use launch::slate_launcher_launch_app;
