//! Discovery of the portable root.
//!
//! These cover the marker-walk branch and the failure modes. The environment
//! variable branch lives in `discover_env.rs`, alone in its own test binary,
//! because process environment is global state and cannot be mutated safely
//! alongside tests running in parallel threads.

use camino::Utf8PathBuf;
use slate_paths::{PathsError, SlatePaths, find_marker_upward};
use slate_testing::PortableRoot;

#[test]
fn finds_the_marker_from_an_executable_nested_at_shipping_depth() {
    let fixture = PortableRoot::new();
    let executable = fixture.install_app("slate-terminal");

    let found = find_marker_upward(&executable).expect("the marker should be found");

    assert_eq!(found, fixture.path());
}

#[test]
fn finds_the_marker_when_starting_from_a_directory() {
    let fixture = PortableRoot::new();
    let directory = fixture.path().join("programs/gencore/slate");

    let found = find_marker_upward(&directory).expect("the marker should be found");

    assert_eq!(found, fixture.path());
}

#[test]
fn returns_the_root_itself_when_starting_there() {
    let fixture = PortableRoot::new();

    let found = find_marker_upward(fixture.path()).expect("the marker should be found");

    assert_eq!(found, fixture.path());
}

#[test]
fn finds_nothing_when_no_marker_exists() {
    let fixture = PortableRoot::without_marker();
    let nested = fixture.path().join("programs/gencore/slate");

    assert_eq!(find_marker_upward(&nested), None);
}

#[test]
fn from_root_rejects_a_directory_without_a_marker() {
    let fixture = PortableRoot::without_marker();

    let error =
        SlatePaths::from_root(fixture.path()).expect_err("a root without a marker is invalid");

    assert!(
        matches!(error, PathsError::InvalidRoot { .. }),
        "expected InvalidRoot, got {error:?}"
    );
}

#[test]
fn from_root_rejects_a_path_that_does_not_exist() {
    let missing = Utf8PathBuf::from("Z:/no/such/portable/root");

    let error = SlatePaths::from_root(missing).expect_err("a missing root is invalid");

    match error {
        PathsError::InvalidRoot { reason, .. } => {
            assert!(
                reason.contains("does not exist"),
                "unhelpful reason: {reason}"
            );
        }
        other => panic!("expected InvalidRoot, got {other:?}"),
    }
}

#[test]
fn from_root_rejects_a_file() {
    let fixture = PortableRoot::new();
    let file = fixture.write_file("appdata/resources/not-a-root.txt", "x");

    let error = SlatePaths::from_root(file).expect_err("a file is not a portable root");

    assert!(
        matches!(error, PathsError::InvalidRoot { .. }),
        "expected InvalidRoot, got {error:?}"
    );
}

#[test]
fn rejects_a_layout_written_by_a_newer_release() {
    let fixture = PortableRoot::new();
    fixture.write_file(
        ".slate-root",
        "[suite]\nversion = \"9.0.0\"\nbuild_id = \"future\"\nschema_version = 999\n",
    );

    let error =
        SlatePaths::from_root(fixture.path()).expect_err("an unknown schema must be refused");

    match error {
        PathsError::UnsupportedSchema { found, expected } => {
            assert_eq!(found, 999);
            assert!(expected < found);
        }
        other => panic!("expected UnsupportedSchema, got {other:?}"),
    }
}

#[test]
fn reports_a_malformed_marker_rather_than_ignoring_it() {
    let fixture = PortableRoot::new();
    fixture.write_file(".slate-root", "this is not toml {{{");

    let error =
        SlatePaths::from_root(fixture.path()).expect_err("a malformed marker must be refused");

    assert!(
        matches!(error, PathsError::MalformedMarker { .. }),
        "expected MalformedMarker, got {error:?}"
    );
}
