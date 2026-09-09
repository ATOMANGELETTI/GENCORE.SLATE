//! Child-process supervision.
//!
//! These deliberately do not start a real application: a test suite that opens
//! windows is a test suite that hangs on a CI runner. What is worth pinning is
//! the behaviour around the spawn — the checks before it and the state after.

// Test-support helpers outside a #[test] function are not covered by
// clippy.toml's allow-expect-in-tests, but the reasoning is the same: a
// fixture that cannot be built should fail loudly here and now.
#![allow(clippy::expect_used)]

use camino::Utf8PathBuf;
use slate_core::KnownApp;
use slate_paths::SlatePaths;
use slate_process::{ProcessError, Supervisor};
use slate_testing::PortableRoot;

fn fixture() -> (PortableRoot, SlatePaths) {
    let root = PortableRoot::new();
    let paths = SlatePaths::from_root(root.path()).expect("the fixture is a valid portable root");
    (root, paths)
}

#[test]
fn a_missing_executable_names_the_path_it_expected() {
    // The common case with a partially extracted install, so the message has
    // to be actionable rather than just "launch failed".
    let (_root, paths) = fixture();
    let supervisor = Supervisor::new();

    let error = supervisor
        .launch(&paths, &KnownApp::Terminal.id())
        .expect_err("nothing is installed");

    match error {
        ProcessError::NotFound { path } => {
            assert!(path.contains("slate-terminal"), "unhelpful path: {path}");
        }
        other => panic!("expected NotFound, got {other:?}"),
    }
}

#[test]
fn nothing_is_running_in_a_fresh_supervisor() {
    let supervisor = Supervisor::new();

    assert!(supervisor.running().is_empty());
    assert!(!supervisor.is_running(&KnownApp::Terminal.id()));
}

#[test]
fn a_failed_launch_leaves_no_recorded_process() {
    let (_root, paths) = fixture();
    let supervisor = Supervisor::new();

    let _ = supervisor.launch(&paths, &KnownApp::Explorer.id());

    assert!(
        supervisor.running().is_empty(),
        "a failed launch must not be recorded"
    );
}

#[test]
fn a_dev_script_is_tracked_the_same_way_as_a_packaged_launch() {
    // A script name that names nothing in the root `package.json`: `bun run`
    // starts and then fails on its own almost immediately, but the OS-level
    // spawn this pins succeeds regardless — this is about the tracking that
    // happens around the spawn, not what the script goes on to do. Bun is a
    // safe assumption here: it is this project's only toolchain (ADR 0001),
    // so anywhere `cargo test` runs, `bun run` already has to work too.
    let supervisor = Supervisor::new();
    let repo_root = Utf8PathBuf::from(".");

    let process = supervisor
        .launch_dev_script(
            &KnownApp::Terminal.id(),
            &repo_root,
            "this-script-does-not-exist",
        )
        .expect("bun itself should still start, whatever it goes on to do with the script name");

    assert_eq!(process.app, KnownApp::Terminal.id());
}
