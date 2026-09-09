//! Application discovery, and launch decisions, for the Launcher.
//!
//! The Launcher shows two kinds of application: the suite's own, and portable
//! applications installed from third-party sources into their vendor
//! directories under `programs/`.
//!
//! Both are read through [`AppProvider`], so adding a source means writing one
//! adapter rather than touching the Launcher. [`NativeProvider`] is
//! implemented; the PortableApps.com and portapps.io adapters are the
//! deliberate next step — the vendor directories exist and the interface is
//! settled, so nothing above them changes when they arrive.
//!
//! ```no_run
//! use launcher_core::Registry;
//! use slate_paths::SlatePaths;
//!
//! let paths = SlatePaths::discover()?;
//! let apps = Registry::with_default_providers().discover(&paths);
//! # Ok::<(), Box<dyn std::error::Error>>(())
//! ```
//!
//! [`plan_launch`] decides *how* to start one of the suite's own sibling
//! applications — the packaged executable, or a `bun run` script in a
//! development checkout that has none yet. `slate-process` does the actual
//! spawning; see that crate for why the two are split.

pub mod launch;
pub mod native;
pub mod provider;
pub mod registry;

pub use launch::{LaunchPlan, plan_launch};
pub use native::NativeProvider;
pub use provider::{AppDescriptor, AppProvider, ProviderError};
pub use registry::Registry;
