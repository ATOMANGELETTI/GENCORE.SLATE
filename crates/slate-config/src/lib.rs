//! Layered TOML configuration for the suite.
//!
//! Configuration resolves in three layers, each overriding the one before it:
//!
//! 1. **Defaults** compiled into the binary, so a completely empty install works.
//! 2. **`appdata/config/suite.toml`** — settings shared by every application.
//! 3. **`appdata/config/<app-id>.toml`** — one application's overrides.
//!
//! A missing file is never an error. A *malformed* file is: silently ignoring
//! a typo would leave the user staring at a setting that appears to have no
//! effect, so parse failures name the file and the problem.
//!
//! ```no_run
//! use slate_config::ConfigStore;
//! use slate_core::KnownApp;
//! use slate_paths::SlatePaths;
//!
//! let paths = SlatePaths::discover()?;
//! let store = ConfigStore::load(&paths, &KnownApp::Launcher.id())?;
//! let theme = store.resolved().effective_theme();
//! # Ok::<(), slate_config::ConfigError>(())
//! ```

pub mod error;
pub mod model;
pub mod store;

pub use error::ConfigError;
pub use model::{AppConfig, ResolvedConfig, SuiteConfig, ThemeMode, WindowConfig, WindowMaterial};
pub use store::ConfigStore;
