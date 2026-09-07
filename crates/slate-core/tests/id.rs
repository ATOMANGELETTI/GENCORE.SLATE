//! Application and vendor identifiers.
//!
//! `AppId` becomes a directory name and a window label, so its validation is a
//! security boundary rather than a tidiness rule.

use slate_core::{AppId, KnownApp, Vendor};

#[test]
fn accepts_well_formed_identifiers() {
    for value in ["slate-launcher", "a", "app-1", "x9-y8-z7"] {
        assert!(AppId::new(value).is_ok(), "{value} should be accepted");
    }
}

#[test]
fn rejects_anything_usable_for_path_traversal() {
    for value in ["..", "../etc", "a/b", "a\\b", "C:/x", ".hidden", "-leading"] {
        assert!(AppId::new(value).is_err(), "{value} must be rejected");
    }
}

#[test]
fn rejects_upper_case_to_avoid_collisions_on_windows() {
    // Windows filesystems are case-insensitive, so "App" and "app" would name
    // the same directory while comparing as different identifiers.
    assert!(AppId::new("App").is_err());
    assert!(AppId::new("SLATE-LAUNCHER").is_err());
}

#[test]
fn rejects_empty_and_over_long_identifiers() {
    assert!(AppId::new("").is_err());
    assert!(AppId::new("a".repeat(AppId::MAX_LENGTH)).is_ok());
    assert!(AppId::new("a".repeat(AppId::MAX_LENGTH + 1)).is_err());
}

#[test]
fn known_applications_have_distinct_stable_identifiers() {
    let ids: Vec<String> = KnownApp::ALL
        .iter()
        .map(|app| app.id().to_string())
        .collect();

    assert_eq!(ids, ["slate-launcher", "slate-terminal", "slate-explorer"]);

    let mut unique = ids.clone();
    unique.sort();
    unique.dedup();
    assert_eq!(unique.len(), ids.len(), "identifiers must be distinct");
}

#[test]
fn known_application_identifiers_are_themselves_valid() {
    for app in KnownApp::ALL {
        assert!(
            AppId::new(app.id().as_str()).is_ok(),
            "{app:?} produces an invalid id"
        );
    }
}

#[test]
fn vendor_directories_are_distinct() {
    let names: Vec<&str> = Vendor::ALL
        .iter()
        .map(|vendor| vendor.directory_name())
        .collect();

    assert_eq!(names, ["gencore", "portableapps.com", "portapps.io"]);
}

#[test]
fn identifiers_round_trip_through_serde() {
    let id = AppId::new("slate-explorer").expect("valid");

    let json = serde_json::to_string(&id).expect("serialises");
    let restored: AppId = serde_json::from_str(&json).expect("deserialises");

    assert_eq!(id, restored);
}

#[test]
fn deserialising_an_invalid_identifier_fails() {
    let result: Result<AppId, _> = serde_json::from_str("\"../escape\"");

    assert!(
        result.is_err(),
        "validation must apply on deserialisation too"
    );
}
