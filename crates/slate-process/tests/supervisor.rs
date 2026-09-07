//! Child-process supervision.
//!
//! These deliberately do not start a real application: a test suite that opens
//! windows is a test suite that hangs on a CI runner. What is worth pinning is
//! the behaviour around the spawn — the checks before it and the state after.

// Test-support helpers outside a #[test] function are not covered by
// clippy.toml's allow-expect-in-tests, but the reasoning is the same: a
// fixture that cannot be built should fail loudly here and now.
#![allow(clippy::expect_used)]

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
