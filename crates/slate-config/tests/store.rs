//! Configuration layering, validation, and persistence.

// Test-support helpers outside a #[test] function are not covered by
// clippy.toml's allow-expect-in-tests, but the reasoning is the same: a
// fixture that cannot be built should fail loudly here and now.
#![allow(clippy::expect_used)]

use slate_config::{ConfigError, ConfigStore, SuiteConfig, ThemeMode};
use slate_core::KnownApp;
use slate_paths::SlatePaths;
use slate_testing::PortableRoot;

fn setup() -> (PortableRoot, SlatePaths) {
    let fixture = PortableRoot::new();
    let paths = SlatePaths::from_root(fixture.path()).expect("the fixture is a valid root");
    (fixture, paths)
}

#[test]
fn a_completely_empty_install_falls_back_to_defaults() {
    let (_fixture, paths) = setup();

    let store = ConfigStore::load(&paths, &KnownApp::Launcher.id()).expect("defaults should load");

    assert_eq!(store.resolved().suite, SuiteConfig::default());
    assert_eq!(store.resolved().effective_theme(), ThemeMode::Dark);
}

#[test]
fn a_partial_file_only_overrides_the_keys_it_names() {
    let (fixture, paths) = setup();
    fixture.write_config("suite.toml", "log-level = \"debug\"\n");

    let store = ConfigStore::load(&paths, &KnownApp::Launcher.id()).expect("loads");

    assert_eq!(store.resolved().suite.log_level, "debug");
    // Everything else keeps its default rather than becoming empty. Compared
    // against `SuiteConfig::default()` rather than against literals, so that
    // changing a default is not mistaken for breaking the merge.
    let defaults = SuiteConfig::default();
    assert_eq!(
        store.resolved().suite.log_retention_days,
        defaults.log_retention_days
    );
    assert_eq!(
        store.resolved().suite.use_system_accent,
        defaults.use_system_accent
    );
    assert_eq!(store.resolved().suite.material, defaults.material);
}

#[test]
fn an_application_theme_overrides_the_suite_theme() {
    let (fixture, paths) = setup();
    fixture.write_config("suite.toml", "theme = \"dark\"\n");
    fixture.write_config("slate-terminal.toml", "theme = \"light\"\n");

    let store = ConfigStore::load(&paths, &KnownApp::Terminal.id()).expect("loads");

    assert_eq!(store.resolved().suite.theme, ThemeMode::Dark);
    assert_eq!(store.resolved().effective_theme(), ThemeMode::Light);
}

#[test]
fn one_applications_settings_do_not_leak_into_another() {
    let (fixture, paths) = setup();
    fixture.write_config("slate-terminal.toml", "theme = \"light\"\n");

    let explorer = ConfigStore::load(&paths, &KnownApp::Explorer.id()).expect("loads");

    assert_eq!(explorer.resolved().effective_theme(), ThemeMode::Dark);
}

#[test]
fn a_malformed_file_is_reported_rather_than_ignored() {
    let (fixture, paths) = setup();
    fixture.write_config("suite.toml", "log-level = this is not toml");

    let error = ConfigStore::load(&paths, &KnownApp::Launcher.id())
        .expect_err("a typo must not be silently discarded");

    match error {
        ConfigError::Malformed { path, .. } => assert!(path.ends_with("suite.toml")),
        other => panic!("expected Malformed, got {other:?}"),
    }
}

#[test]
fn an_unknown_log_level_is_rejected_with_the_valid_options() {
    let (fixture, paths) = setup();
    fixture.write_config("suite.toml", "log-level = \"verbose\"\n");

    let error = ConfigStore::load(&paths, &KnownApp::Launcher.id()).expect_err("invalid level");

    match error {
        ConfigError::Invalid { field, reason } => {
            assert_eq!(field, "suite.log-level");
            assert!(
                reason.contains("trace"),
                "the message should list the options: {reason}"
            );
        }
        other => panic!("expected Invalid, got {other:?}"),
    }
}

#[test]
fn a_window_smaller_than_the_minimum_is_rejected() {
    let (fixture, paths) = setup();
    fixture.write_config(
        "slate-launcher.toml",
        "[window]\nwidth = 100.0\nheight = 80.0\n",
    );

    let error = ConfigStore::load(&paths, &KnownApp::Launcher.id()).expect_err("too small");

    assert!(
        matches!(error, ConfigError::Invalid { .. }),
        "got {error:?}"
    );
}

#[test]
fn updates_are_written_and_survive_a_reload() {
    let (_fixture, paths) = setup();
    let app_id = KnownApp::Explorer.id();
    let mut store = ConfigStore::load(&paths, &app_id).expect("loads");

    let mut app = store.resolved().app.clone();
    app.theme = Some(ThemeMode::Light);
    app.window.width = 1_400.0;
    store.update_app(app).expect("the update is valid");

    let reloaded = ConfigStore::load(&paths, &app_id).expect("reloads");

    assert_eq!(reloaded.resolved().effective_theme(), ThemeMode::Light);
    assert!((reloaded.resolved().app.window.width - 1_400.0).abs() < f64::EPSILON);
}

#[test]
fn an_invalid_update_is_refused_and_leaves_the_stored_value_alone() {
    let (_fixture, paths) = setup();
    let mut store = ConfigStore::load(&paths, &KnownApp::Launcher.id()).expect("loads");

    let mut app = store.resolved().app.clone();
    app.window.height = 10.0;
    let error = store.update_app(app).expect_err("too small to accept");

    assert!(matches!(error, ConfigError::Invalid { .. }));
    assert!((store.resolved().app.window.height - 720.0).abs() < f64::EPSILON);
}

#[test]
fn seeding_writes_readable_files_and_does_not_overwrite_existing_ones() {
    let (fixture, paths) = setup();
    fixture.write_config("suite.toml", "log-level = \"trace\"\n");
    let app_id = KnownApp::Launcher.id();

    ConfigStore::seed_defaults(&paths, &app_id).expect("seeds");

    assert!(paths.config_file(&app_id).is_file());
    let store = ConfigStore::load(&paths, &app_id).expect("loads");
    assert_eq!(
        store.resolved().suite.log_level,
        "trace",
        "an existing file must be preserved"
    );
}
