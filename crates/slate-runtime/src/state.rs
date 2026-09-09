//! Shared application state, managed by Tauri and available to every command.

use std::sync::atomic::{AtomicBool, Ordering};

use parking_lot::RwLock;
use slate_config::{ConfigStore, ResolvedConfig};
use slate_core::AppId;
use slate_paths::SlatePaths;

use crate::error::RuntimeError;

/// The state every SLATE application registers with Tauri.
///
/// Commands read paths and configuration from here rather than resolving
/// anything themselves — which is what keeps the portability guarantee in one
/// place instead of scattered across three applications.
#[derive(Debug)]
pub struct SlateState {
    app_id: AppId,
    paths: SlatePaths,
    config: RwLock<ConfigStore>,
    /// Whether the window is pinned above others.
    ///
    /// Deliberately in memory rather than in configuration: pinning a window
    /// is a thing you do for the next few minutes, and a setting that
    /// resurrects it three days later on a fresh launch is a bug report.
    /// Tauri exposes no getter, so the value has to be remembered somewhere.
    is_always_on_top: AtomicBool,
}

impl SlateState {
    /// Creates state from an already-bootstrapped environment.
    pub fn new(app_id: AppId, paths: SlatePaths, config: ConfigStore) -> Self {
        Self {
            app_id,
            paths,
            config: RwLock::new(config),
            is_always_on_top: AtomicBool::new(false),
        }
    }

    /// Whether the window is currently pinned above other windows.
    pub fn is_always_on_top(&self) -> bool {
        self.is_always_on_top.load(Ordering::Relaxed)
    }

    /// Records that the window has been pinned or released.
    pub fn set_always_on_top(&self, is_enabled: bool) {
        self.is_always_on_top.store(is_enabled, Ordering::Relaxed);
    }

    /// Which application this is.
    pub fn app_id(&self) -> &AppId {
        &self.app_id
    }

    /// Every path this application may use.
    pub fn paths(&self) -> &SlatePaths {
        &self.paths
    }

    /// A snapshot of the current configuration.
    ///
    /// Returns a clone rather than a guard so that a command cannot hold the
    /// lock across an await point or a window call, which is the usual way a
    /// UI thread ends up blocked on a reload.
    pub fn config(&self) -> ResolvedConfig {
        self.config.read().resolved().clone()
    }

    /// Re-reads configuration from disk.
    ///
    /// Called when the broker announces that a setting changed elsewhere.
    ///
    /// # Errors
    ///
    /// Returns [`RuntimeError::Config`] if the files on disk are malformed.
    pub fn reload_config(&self) -> Result<(), RuntimeError> {
        self.config.write().reload(&self.paths)?;
        Ok(())
    }

    /// Applies and persists a change to this application's configuration.
    ///
    /// # Errors
    ///
    /// Returns [`RuntimeError::Config`] if the new values are invalid or
    /// cannot be written.
    pub fn update_config(
        &self,
        change: impl FnOnce(&mut slate_config::AppConfig),
    ) -> Result<(), RuntimeError> {
        let mut store = self.config.write();
        let mut app = store.resolved().app.clone();
        change(&mut app);
        store.update_app(app)?;
        Ok(())
    }
}
