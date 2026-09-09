//! The `SLATE_REPO_ROOT` variable.
//!
//! This lives in its own test binary and contains exactly one test, for the
//! same reason as `discover_env.rs`: the process environment is global mutable
//! state shared by every thread, and Cargo runs tests within a binary in
//! parallel — so mutating it beside other tests would make unrelated tests
//! fail intermittently.

// `std::env::set_var` is unsafe in the 2024 edition because another thread may
// be reading the environment concurrently. This binary has exactly one test,
// so there is no other thread to race with.
#![allow(unsafe_code)]

use camino::Utf8PathBuf;
use slate_paths::{ENV_REPO_ROOT, dev_repo_root};

#[test]
fn reports_the_repository_root_only_while_the_variable_is_set() {
    assert_eq!(
        dev_repo_root(),
        None,
        "should start unset in a clean test process"
    );

    // SAFETY: this test binary is single-threaded — one test, no spawned
    // threads — so no other thread can be reading the environment.
    unsafe {
        std::env::set_var(ENV_REPO_ROOT, "/repo");
    }
    assert_eq!(dev_repo_root(), Some(Utf8PathBuf::from("/repo")));

    // SAFETY: as above.
    unsafe {
        std::env::remove_var(ENV_REPO_ROOT);
    }
    assert_eq!(dev_repo_root(), None, "should be unset again after cleanup");
}
