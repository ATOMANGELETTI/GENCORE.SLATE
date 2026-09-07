//! Suite version parsing and compatibility.

use slate_core::SuiteVersion;

#[test]
fn parses_a_plain_semantic_version() {
    let version = SuiteVersion::parse("1.4.2").expect("parses");

    assert_eq!(version.major, 1);
    assert_eq!(version.minor, 4);
    assert_eq!(version.patch, 2);
}

#[test]
fn ignores_pre_release_and_build_metadata() {
    assert_eq!(
        SuiteVersion::parse("2.0.0-rc.1"),
        SuiteVersion::parse("2.0.0")
    );
    assert_eq!(
        SuiteVersion::parse("2.0.0+build.7"),
        SuiteVersion::parse("2.0.0")
    );
}

#[test]
fn rejects_malformed_versions() {
    for value in ["", "1", "1.2", "1.2.3.4", "x.y.z", "1.2.z"] {
        assert!(
            SuiteVersion::parse(value).is_none(),
            "{value} must not parse"
        );
    }
}

#[test]
fn displays_in_the_form_it_parsed() {
    let version = SuiteVersion::parse("0.1.0").expect("parses");

    assert_eq!(version.to_string(), "0.1.0");
}

#[test]
fn before_one_point_zero_each_minor_is_treated_as_incompatible() {
    let a = SuiteVersion::parse("0.1.0").expect("parses");
    let b = SuiteVersion::parse("0.2.0").expect("parses");
    let c = SuiteVersion::parse("0.1.9").expect("parses");

    assert!(
        !a.is_compatible_with(&b),
        "0.x minor bumps may break the layout"
    );
    assert!(a.is_compatible_with(&c), "0.x patch bumps are compatible");
}

#[test]
fn after_one_point_zero_the_major_governs_compatibility() {
    let a = SuiteVersion::parse("1.0.0").expect("parses");
    let b = SuiteVersion::parse("1.9.3").expect("parses");
    let c = SuiteVersion::parse("2.0.0").expect("parses");

    assert!(a.is_compatible_with(&b));
    assert!(!a.is_compatible_with(&c));
}

#[test]
fn the_compiled_version_is_parseable() {
    // Guards against scripts/bun-version.ts writing something malformed into
    // the Cargo workspace.
    let current = SuiteVersion::current();

    assert!(
        current.major > 0 || current.minor > 0 || current.patch > 0,
        "the compiled suite version should not be 0.0.0"
    );
}

#[test]
fn versions_order_naturally() {
    let mut versions = [
        SuiteVersion::parse("1.2.0").expect("parses"),
        SuiteVersion::parse("0.9.9").expect("parses"),
        SuiteVersion::parse("1.10.0").expect("parses"),
        SuiteVersion::parse("1.2.1").expect("parses"),
    ];

    versions.sort();

    let rendered: Vec<String> = versions.iter().map(ToString::to_string).collect();
    assert_eq!(rendered, ["0.9.9", "1.2.0", "1.2.1", "1.10.0"]);
}
