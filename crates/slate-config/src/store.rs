//! Loading, resolving, and persisting configuration.

use camino::{Utf8Path, Utf8PathBuf};
use serde::Serialize;
use serde::de::DeserializeOwned;
use slate_core::AppId;
use slate_paths::SlatePaths;

use crate::error::ConfigError;
use crate::model::{AppConfig, ResolvedConfig, SuiteConfig};

/// Log levels the suite accepts, in increasing verbosity.
const LOG_LEVELS: [&str; 5] = ["error", "warn", "info", "debug", "trace"];

/// The configuration for one application, resolved from every layer.
#[derive(Debug, Clone)]
pub struct ConfigStore {
    app_id: AppId,
    suite_path: Utf8PathBuf,
    app_path: Utf8PathBuf,
    resolved: ResolvedConfig,
}

impl ConfigStore {
    /// Loads and validates configuration for `app_id`.
    ///
    /// Missing files fall back to defaults. Malformed files do not.
    ///
    /// # Errors
    ///
    /// Returns [`ConfigError::Malformed`] or [`ConfigError::Unreadable`]
    /// naming the offending file, or [`ConfigError::Invalid`] when a value is
    /// out of range.
    pub fn load(paths: &SlatePaths, app_id: &AppId) -> Result<Self, ConfigError> {
        let suite_path = paths.suite_config_file();
        let app_path = paths.config_file(app_id);

        let suite: SuiteConfig = read_toml_or_default(&suite_path)?;
        let app: AppConfig = read_toml_or_default(&app_path)?;

        let resolved = ResolvedConfig { suite, app };
        validate(&resolved)?;

        Ok(Self {
            app_id: app_id.clone(),
            suite_path,
            app_path,
            resolved,
        })
    }

    /// The application this configuration belongs to.
    pub fn app_id(&self) -> &AppId {
        &self.app_id
    }

    /// The resolved configuration.
    pub fn resolved(&self) -> &ResolvedConfig {
        &self.resolved
    }

    /// Replaces the application layer and writes it to disk.
    ///
    /// Only the application file is written. Suite settings are shared, so an
    /// application changing them on its own behalf would surprise the others.
    ///
    /// # Errors
    ///
    /// Returns [`ConfigError::Invalid`] if the new values fail validation, or
    /// [`ConfigError::Unwritable`] if the file cannot be saved.
    pub fn update_app(&mut self, app: AppConfig) -> Result<(), ConfigError> {
        let candidate = ResolvedConfig {
            suite: self.resolved.suite.clone(),
            app,
        };
        validate(&candidate)?;

        write_toml(&self.app_path, &candidate.app)?;
        self.resolved = candidate;
        Ok(())
    }

    /// Writes the suite layer.
    ///
    /// Reserved for the Launcher, which owns suite-wide settings.
    ///
    /// # Errors
    ///
    /// As [`ConfigStore::update_app`].
    pub fn update_suite(&mut self, suite: SuiteConfig) -> Result<(), ConfigError> {
        let candidate = ResolvedConfig {
            suite,
            app: self.resolved.app.clone(),
        };
        validate(&candidate)?;

        write_toml(&self.suite_path, &candidate.suite)?;
        self.resolved = candidate;
        Ok(())
    }

    /// Re-reads both layers from disk.
    ///
    /// Applications call this when the broker announces a configuration
    /// change, so a setting altered in the Launcher reaches every window
    /// without a restart.
    ///
    /// # Errors
    ///
    /// As [`ConfigStore::load`].
    pub fn reload(&mut self, paths: &SlatePaths) -> Result<(), ConfigError> {
        *self = Self::load(paths, &self.app_id.clone())?;
        Ok(())
    }

    /// Writes both layers with their current values, creating missing files.
    ///
    /// Used at first run so a fresh install ships a readable, editable
    /// configuration rather than an empty directory.
    ///
    /// # Errors
    ///
    /// Returns [`ConfigError::Unwritable`] naming the file that failed.
    pub fn seed_defaults(paths: &SlatePaths, app_id: &AppId) -> Result<(), ConfigError> {
        let suite_path = paths.suite_config_file();
        if !suite_path.exists() {
            write_toml(&suite_path, &SuiteConfig::default())?;
        }

        let app_path = paths.config_file(app_id);
        if !app_path.exists() {
            write_toml(&app_path, &AppConfig::default())?;
        }

        Ok(())
    }
}

/// Reads a TOML file, returning the type's default when the file is absent.
fn read_toml_or_default<T: DeserializeOwned + Default>(path: &Utf8Path) -> Result<T, ConfigError> {
    if !path.exists() {
        return Ok(T::default());
    }

    let contents = std::fs::read_to_string(path).map_err(|error| ConfigError::Unreadable {
        path: path.to_owned(),
        reason: error.to_string(),
    })?;

    toml::from_str(&contents).map_err(|error| ConfigError::Malformed {
        path: path.to_owned(),
        reason: error.to_string(),
    })
}

/// Serialises `value` to TOML, creating parent directories as needed.
fn write_toml<T: Serialize>(path: &Utf8Path, value: &T) -> Result<(), ConfigError> {
    let rendered = toml::to_string_pretty(value).map_err(|error| ConfigError::Unwritable {
        path: path.to_owned(),
        reason: error.to_string(),
    })?;

    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|error| ConfigError::Unwritable {
            path: path.to_owned(),
            reason: error.to_string(),
        })?;
    }

    std::fs::write(path, rendered).map_err(|error| ConfigError::Unwritable {
        path: path.to_owned(),
        reason: error.to_string(),
    })
}

/// Rejects values that would produce a broken window or an unusable log.
fn validate(config: &ResolvedConfig) -> Result<(), ConfigError> {
    if !LOG_LEVELS.contains(&config.suite.log_level.as_str()) {
        return Err(ConfigError::Invalid {
            field: "suite.log-level".to_owned(),
            reason: format!(
                "{:?} is not one of {}",
                config.suite.log_level,
                LOG_LEVELS.join(", ")
            ),
        });
    }

    let window = &config.app.window;
    if !window.width.is_finite() || !window.height.is_finite() {
        return Err(ConfigError::Invalid {
            field: "app.window".to_owned(),
            reason: "width and height must be finite numbers".to_owned(),
        });
    }
    if window.width < 480.0 || window.height < 360.0 {
        return Err(ConfigError::Invalid {
            field: "app.window".to_owned(),
            reason: format!(
                "{}x{} is smaller than the 480x360 minimum",
                window.width, window.height
            ),
        });
    }

    Ok(())
}
