//! Deciding how to start a sibling application.

// Test-support helpers outside a #[test] function are not covered by
// clippy.toml's allow-expect-in-tests, but the reasoning is the same: a
// fixture that cannot be built should fail loudly here and now.
#![allow(clippy::expect_used)]

use camino::Utf8PathBuf;
use launcher_core::{LaunchPlan, plan_launch};
use slate_core::KnownApp;
use slate_paths::SlatePaths;
use slate_testing::PortableRoot;

fn fixture() -> (PortableRoot, SlatePaths) {
    let root = PortableRoot::new();
    let paths = SlatePaths::from_root(root.path()).expect("the fixture is a valid portable root");
    (root, paths)
}

#[test]
fn without_a_dev_repo_root_it_plans_the_packaged_executable() {
    let (_root, paths) = fixture();
    let terminal = KnownApp::Terminal.id();

    let plan = plan_launch(&paths, &terminal, None);

    assert_eq!(
        plan,
        LaunchPlan::Executable(paths.app_executable(&terminal))
    );
}

#[test]
fn with_a_dev_repo_root_it_plans_the_bun_run_script() {
    let (_root, paths) = fixture();
    let repo_root = Utf8PathBuf::from("/repo");

    let plan = plan_launch(&paths, &KnownApp::Terminal.id(), Some(&repo_root));

    assert_eq!(
        plan,
        LaunchPlan::DevScript {
            repo_root,
            script: "dev:terminal".to_owned(),
        }
    );
}

#[test]
fn the_dev_script_name_matches_the_root_package_json_for_every_sibling() {
    let (_root, paths) = fixture();
    let repo_root = Utf8PathBuf::from("/repo");

    let terminal = plan_launch(&paths, &KnownApp::Terminal.id(), Some(&repo_root));
    let explorer = plan_launch(&paths, &KnownApp::Explorer.id(), Some(&repo_root));

    assert_eq!(
        terminal,
        LaunchPlan::DevScript {
            repo_root: repo_root.clone(),
            script: "dev:terminal".to_owned(),
        }
    );
    assert_eq!(
        explorer,
        LaunchPlan::DevScript {
            repo_root,
            script: "dev:explorer".to_owned(),
        }
    );
}

#[test]
fn a_dev_repo_root_wins_even_when_the_packaged_executable_also_exists() {
    // A debug build run inside an assembled installDir would otherwise be
    // ambiguous. The rule is simple and predictable rather than existence-
    // based: a known repo root always means the development workflow.
    let (root, paths) = fixture();
    root.install_app("slate-terminal");
    let repo_root = Utf8PathBuf::from("/repo");

    let plan = plan_launch(&paths, &KnownApp::Terminal.id(), Some(&repo_root));

    assert_eq!(
        plan,
        LaunchPlan::DevScript {
            repo_root,
            script: "dev:terminal".to_owned(),
        }
    );
}
