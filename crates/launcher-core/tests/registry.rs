//! Application discovery.

// Test-support helpers outside a #[test] function are not covered by
// clippy.toml's allow-expect-in-tests, but the reasoning is the same: a
// fixture that cannot be built should fail loudly here and now.
#![allow(clippy::expect_used)]

use launcher_core::{NativeProvider, Registry};
use slate_core::Vendor;
use slate_paths::SlatePaths;
use slate_testing::PortableRoot;

fn fixture() -> (PortableRoot, SlatePaths) {
    let root = PortableRoot::new();
    let paths = SlatePaths::from_root(root.path()).expect("the fixture is a valid portable root");
    (root, paths)
}

#[test]
fn finds_nothing_in_an_empty_install() {
    let (_root, paths) = fixture();

    let apps = Registry::with_default_providers().discover(&paths);

    assert!(apps.is_empty(), "nothing is installed yet");
}

#[test]
fn finds_the_applications_that_are_actually_present() {
    let (root, paths) = fixture();
    root.install_app("slate-terminal");

    let apps = Registry::with_default_providers().discover(&paths);

    assert_eq!(apps.len(), 1);
    assert_eq!(apps[0].display_name, "Terminal");
    assert_eq!(apps[0].vendor, Vendor::Gencore);
}

#[test]
fn a_partially_extracted_install_still_lists_what_made_it() {
    // A zip that failed halfway must not produce an empty Launcher with no
    // explanation; it should show whatever is genuinely there.
    let (root, paths) = fixture();
    root.install_app("slate-explorer");

    let apps = Registry::with_default_providers().discover(&paths);

    assert_eq!(apps.len(), 1);
    assert_eq!(apps[0].display_name, "Explorer");
}

#[test]
fn does_not_offer_to_launch_the_launcher() {
    // The Launcher is what is doing the discovering; listing it would be an
    // invitation to start a second one.
    let (root, paths) = fixture();
    root.install_app("slate-launcher");
    root.install_app("slate-terminal");

    let apps = Registry::with_default_providers().discover(&paths);

    assert_eq!(apps.len(), 1);
    assert_eq!(apps[0].id.as_str(), "slate-terminal");
}

#[test]
fn paths_are_relative_and_use_forward_slashes() {
    let (root, paths) = fixture();
    root.install_app("slate-terminal");

    let apps = Registry::with_default_providers().discover(&paths);
    let app = &apps[0];

    assert_eq!(
        app.executable,
        "programs/gencore/slate/slate-terminal/slate-terminal.exe"
    );
    assert!(!app.executable.contains('\\'));
    assert!(
        !app.relative_path.contains(':'),
        "no drive letter may appear"
    );
}

#[test]
fn results_are_ordered_predictably() {
    // Filesystem enumeration order is not stable; the list the user sees must
    // be, or the Launcher reshuffles between runs for no reason.
    let (root, paths) = fixture();
    root.install_app("slate-terminal");
    root.install_app("slate-explorer");

    let first = Registry::with_default_providers().discover(&paths);
    let second = Registry::with_default_providers().discover(&paths);

    let names: Vec<&str> = first.iter().map(|app| app.display_name.as_str()).collect();
    assert_eq!(names, ["Explorer", "Terminal"]);
    assert_eq!(first, second);
}

#[test]
fn the_default_registry_has_the_native_provider() {
    assert_eq!(Registry::with_default_providers().provider_count(), 1);
}

#[test]
fn a_provider_can_be_added() {
    let mut registry = Registry::new(Vec::new());
    assert_eq!(registry.provider_count(), 0);

    registry.register(Box::new(NativeProvider::new()));

    assert_eq!(registry.provider_count(), 1);
}
