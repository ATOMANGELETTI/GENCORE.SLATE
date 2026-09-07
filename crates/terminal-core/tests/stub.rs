//! The stubbed terminal backend.
//!
//! These pin the *contract* rather than any behaviour: the point of the stub
//! is that the Terminal can be wired end to end against the real interface
//! before a PTY exists. When the ConPTY backend lands, these should keep
//! passing for `StubBackend` and be joined by a parallel suite for the real one.

use terminal_core::{GridSize, SessionError, SessionId, SessionSpec, StubBackend, TerminalBackend};

#[test]
fn opening_a_session_reports_that_the_backend_is_not_implemented() {
    let backend = StubBackend::new();

    let error = backend
        .open(SessionSpec::default())
        .expect_err("the stub starts nothing");

    assert!(matches!(error, SessionError::NotImplemented));
}

#[test]
fn a_distinct_variant_separates_not_built_from_tried_and_failed() {
    // A generic failure here would be indistinguishable from a real PTY error
    // once the backend exists — exactly when the difference starts to matter.
    let backend = StubBackend::new();

    assert_eq!(
        backend.write(SessionId::new(), b"ls").unwrap_err(),
        SessionError::NotImplemented
    );
    assert_eq!(
        backend
            .resize(SessionId::new(), GridSize::default())
            .unwrap_err(),
        SessionError::NotImplemented,
    );
    assert_eq!(
        backend.close(SessionId::new()).unwrap_err(),
        SessionError::NotImplemented
    );
}

#[test]
fn records_what_was_requested_so_the_interface_can_be_tested() {
    let backend = StubBackend::new();
    let spec = SessionSpec {
        shell: Some("pwsh".to_owned()),
        ..SessionSpec::default()
    };

    let _ = backend.open(spec.clone());

    assert_eq!(backend.requested(), vec![spec]);
}

#[test]
fn reports_no_sessions() {
    assert!(StubBackend::new().sessions().is_empty());
}

#[test]
fn the_default_grid_is_the_conventional_eighty_by_twenty_four() {
    let size = GridSize::default();

    assert_eq!(size.columns, 80);
    assert_eq!(size.rows, 24);
}

#[test]
fn session_identifiers_are_unique() {
    assert_ne!(SessionId::new(), SessionId::new());
}

#[test]
fn a_session_has_no_absolute_working_directory_by_default() {
    // An absolute path would let a caller start a shell anywhere on the host,
    // which is what the portable boundary exists to prevent.
    assert!(SessionSpec::default().working_directory.is_none());
}
