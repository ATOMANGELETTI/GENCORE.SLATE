//! The `SLATE_INSTALL_DIR` discovery branch.
//!
//! This lives in its own test binary and contains exactly one test on purpose.
//! The process environment is global mutable state shared by every thread, and
//! Cargo runs tests within a binary in parallel — so mutating it beside other
//! tests would make unrelated tests fail intermittently.

// `std::env::set_var` is unsafe in the 2024 edition because another thread may
// be reading the environment concurrently. This binary has exactly one test,
// so there is no other thread to race with.
#![allow(unsafe_code)]

use slate_paths::{ENV_INSTALL_DIR, discover_root};
use slate_testing::PortableRoot;

#[test]
fn the_install_dir_variable_takes_priority_over_walking_upward() {
    let fixture = PortableRoot::new();

    // SAFETY: this test binary is single-threaded — one test, no spawned
    // threads — so no other thread can be reading the environment.
    unsafe {
        std::env::set_var(ENV_INSTALL_DIR, fixture.path().as_str());
    }

    let discovered = discover_root().expect("the override should be honoured");
    assert_eq!(discovered, fixture.path());

    // SAFETY: as above.
    unsafe {
        std::env::remove_var(ENV_INSTALL_DIR);
    }
}
