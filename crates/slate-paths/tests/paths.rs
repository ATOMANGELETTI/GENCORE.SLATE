//! Path resolution, layout creation, and the escape guard.

// Test-support helpers outside a #[test] function are not covered by
// clippy.toml's allow-expect-in-tests, but the reasoning is the same: a
// fixture that cannot be built should fail loudly here and now.
#![allow(clippy::expect_used)]

use slate_core::{AppId, KnownApp, Vendor};
use slate_paths::{PathsError, SlatePaths, StorageKind};
use slate_testing::PortableRoot;

fn paths() -> (PortableRoot, SlatePaths) {
    let fixture = PortableRoot::new();
    let paths =
        SlatePaths::from_root(fixture.path()).expect("the fixture is a valid portable root");
    (fixture, paths)
}

#[test]
fn every_directory_resolves_inside_the_portable_root() {
    let (_fixture, paths) = paths();
    let launcher = KnownApp::Launcher.id();

    let candidates = [
        paths.config_dir(),
        paths.database_dir(),
        paths.logs_dir(),
        paths.resources_dir(),
        paths.binaries_dir(),
        paths.webview2_runtime_dir(),
        paths.webview2_user_data_dir(&launcher),
        paths.suite_programs_dir(),
        paths.app_dir(&launcher),
        paths.app_executable(&launcher),
        paths.database_file(),
        paths.suite_config_file(),
        paths.config_file(&launcher),
    ];

    for candidate in candidates {
        assert!(
            paths.contains(&candidate),
            "{candidate} resolved outside the portable root"
        );
    }
}

#[test]
fn vendor_directories_match_the_shipped_layout() {
    let (_fixture, paths) = paths();

    assert!(
        paths
            .vendor_dir(Vendor::Gencore)
            .ends_with("programs/gencore")
    );
    assert!(
        paths
            .vendor_dir(Vendor::PortableAppsCom)
            .ends_with("programs/portableapps.com")
    );
    assert!(
        paths
            .vendor_dir(Vendor::PortappsIo)
            .ends_with("programs/portapps.io")
    );
    assert!(
        paths
            .suite_programs_dir()
            .ends_with("programs/gencore/slate")
    );
}

#[test]
fn application_executables_sit_beside_their_own_directory() {
    let (_fixture, paths) = paths();
    let terminal = KnownApp::Terminal.id();

    let executable = paths.app_executable(&terminal);

    assert!(executable.ends_with("programs/gencore/slate/slate-terminal/slate-terminal.exe"));
}

#[test]
fn webview2_user_data_is_separated_per_application() {
    let (_fixture, paths) = paths();

    let launcher = paths.webview2_user_data_dir(&KnownApp::Launcher.id());
    let terminal = paths.webview2_user_data_dir(&KnownApp::Terminal.id());

    assert_ne!(launcher, terminal);
    assert!(paths.contains(&launcher));
    assert!(paths.contains(&terminal));
}

#[test]
fn storage_directories_cover_every_kind() {
    let (_fixture, paths) = paths();

    for kind in StorageKind::ALL {
        let directory = paths.storage(kind);
        assert!(directory.ends_with(kind.directory_name()));
        assert!(paths.contains(&directory));
    }
}

#[test]
fn ensure_layout_creates_every_directory_and_is_idempotent() {
    let (_fixture, paths) = paths();

    paths
        .ensure_layout()
        .expect("the layout should be creatable");
    paths
        .ensure_layout()
        .expect("running it twice must be harmless");

    assert!(paths.config_dir().is_dir());
    assert!(paths.database_dir().is_dir());
    assert!(paths.logs_dir().is_dir());
    assert!(paths.webview2_runtime_dir().is_dir());
    for kind in StorageKind::ALL {
        assert!(paths.storage(kind).is_dir(), "{kind:?} was not created");
    }
}

#[test]
fn ensure_layout_repairs_a_partially_extracted_install() {
    let (fixture, paths) = paths();
    std::fs::remove_dir_all(fixture.path().join("appdata/logs")).expect("removable");

    paths
        .ensure_layout()
        .expect("the layout should be repaired");

    assert!(paths.logs_dir().is_dir());
}

#[test]
fn resolve_within_accepts_an_ordinary_relative_path() {
    let (_fixture, paths) = paths();
    let base = paths.storage(StorageKind::Documents);

    let resolved = paths
        .resolve_within(&base, "notes/2026/september.md")
        .expect("a plain relative path is fine");

    assert!(paths.contains(&resolved));
    assert!(resolved.ends_with("notes/2026/september.md"));
}

#[test]
fn resolve_within_normalises_harmless_traversal() {
    let (_fixture, paths) = paths();
    let base = paths.storage(StorageKind::Documents);

    let resolved = paths
        .resolve_within(&base, "notes/../letters/draft.md")
        .expect("traversal that stays inside the root is fine");

    assert!(resolved.ends_with("documents/letters/draft.md"));
}

#[test]
fn resolve_within_rejects_traversal_out_of_the_root() {
    let (_fixture, paths) = paths();
    let base = paths.storage(StorageKind::Documents);

    let error = paths
        .resolve_within(
            &base,
            "../../../../../../../../Windows/System32/drivers/etc/hosts",
        )
        .expect_err("traversal out of the root must be refused");

    assert!(
        matches!(error, PathsError::EscapesRoot { .. }),
        "expected EscapesRoot, got {error:?}"
    );
}

#[test]
fn resolve_within_rejects_an_absolute_path() {
    let (_fixture, paths) = paths();
    let base = paths.storage(StorageKind::Documents);

    let error = paths
        .resolve_within(&base, "C:/Windows/System32/config/SAM")
        .expect_err("an absolute path must be refused");

    assert!(
        matches!(error, PathsError::EscapesRoot { .. }),
        "expected EscapesRoot, got {error:?}"
    );
}

#[test]
fn contains_rejects_a_sibling_directory_with_a_shared_prefix() {
    let (fixture, paths) = paths();

    // A naive string prefix check would accept this. Path-component
    // comparison must not.
    let sibling = format!("{}-evil/config.toml", fixture.path());

    assert!(!paths.contains(camino::Utf8Path::new(&sibling)));
}

#[test]
fn the_marker_reports_the_suite_version() {
    let (_fixture, paths) = paths();

    let version = paths
        .marker()
        .version()
        .expect("the fixture version parses");

    assert_eq!(version.to_string(), "0.1.0");
}

#[test]
fn application_ids_reject_path_traversal() {
    assert!(AppId::new("../escape").is_err());
    assert!(AppId::new("C:/absolute").is_err());
    assert!(AppId::new("Upper").is_err());
    assert!(AppId::new("").is_err());
    assert!(AppId::new("slate-terminal").is_ok());
}
