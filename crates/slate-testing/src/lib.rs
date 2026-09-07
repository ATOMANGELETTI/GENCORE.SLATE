//! Test fixtures for the suite.
//!
//! The central fixture is [`PortableRoot`], a throwaway directory laid out
//! exactly like a shipped install. Tests that need paths, configuration, or a
//! database build one instead of touching the real filesystem.
//!
//! This crate deliberately does **not** depend on `slate-paths`, even though
//! it reproduces the same layout. If it did, a bug in path resolution could be
//! mirrored in the fixture and the tests would agree with the bug. Keeping the
//! layout written out independently here means the tests check the real thing.
//!
//! Never depend on this crate outside `[dev-dependencies]`.

// A fixture that cannot be built means a broken test environment, not a
// condition a test could handle. Panicking here reports it at the point of
// failure; threading Result through every fixture would only move the noise.
#![allow(clippy::expect_used)]

pub mod root;

pub use root::PortableRoot;
