//! The configuration schema.
//!
//! Every field has a default, so a missing or partial file is never an error —
//! a user who deletes a line gets the default back rather than an app that
//! refuses to start.

use serde::{Deserialize, Serialize};

/// Which theme the interface renders in.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum ThemeMode {
    /// Follow the Windows light/dark setting.
    System,
    /// Always light.
    Light,
    /// Always dark. The suite's default — see ADR 0010.
    #[default]
    Dark,
}

/// How much window translucency to request.
///
/// Mica and Acrylic need Windows 11; on anything older the runtime falls back
/// to a solid surface, so this is a preference rather than a guarantee.
///
/// The default is `Solid`, which is a design decision rather than a
/// conservative one: Mica tints the window with whatever the user's wallpaper
/// happens to be, and the suite's palette is Nord — a specific, published set
/// of colours whose whole value is being those colours. A Mica-tinted `nord0`
/// is not `nord0`. Translucency remains available for anyone who prefers it.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum WindowMaterial {
    /// A solid background token. Always available.
    #[default]
    Solid,
    /// Windows 11 Mica.
    Mica,
    /// Windows 11 Acrylic — heavier blur, higher cost.
    Acrylic,
}

/// Settings shared by every application in the suite.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(default, rename_all = "kebab-case")]
pub struct SuiteConfig {
    /// Theme applied across every window.
    pub theme: ThemeMode,
    /// Requested window material.
    pub material: WindowMaterial,
    /// Follow the Windows accent colour instead of the suite's own.
    ///
    /// Off by default. The suite's accent is Nord Frost, chosen against the
    /// rest of the palette and contrast-checked with it; an arbitrary Windows
    /// accent dropped into that place is neither.
    pub use_system_accent: bool,
    /// Collapse animations to opacity changes only.
    pub reduce_motion: bool,
    /// Log verbosity: `error`, `warn`, `info`, `debug`, or `trace`.
    pub log_level: String,
    /// How many days of rolling logs to retain.
    pub log_retention_days: u16,
}

impl Default for SuiteConfig {
    fn default() -> Self {
        Self {
            theme: ThemeMode::default(),
            material: WindowMaterial::default(),
            use_system_accent: false,
            reduce_motion: false,
            log_level: "info".to_owned(),
            log_retention_days: 14,
        }
    }
}

/// Remembered window geometry.
///
/// Persisted so the suite reopens where the user left it — which matters more
/// than usual here, because custom chrome means Windows Snap Layouts are not
/// available to reposition a window (ADR 0010).
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(default, rename_all = "kebab-case")]
pub struct WindowConfig {
    /// Width in logical pixels.
    pub width: f64,
    /// Height in logical pixels.
    pub height: f64,
    /// Last horizontal position, if the window has been moved.
    pub x: Option<f64>,
    /// Last vertical position, if the window has been moved.
    pub y: Option<f64>,
    /// Whether the window was zoomed when it closed.
    pub maximized: bool,
}

impl Default for WindowConfig {
    fn default() -> Self {
        Self {
            width: 1_100.0,
            height: 720.0,
            x: None,
            y: None,
            maximized: false,
        }
    }
}

/// Settings belonging to a single application.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(default, rename_all = "kebab-case")]
pub struct AppConfig {
    /// Window geometry to restore on launch.
    pub window: WindowConfig,
    /// Overrides the suite theme for this application only.
    pub theme: Option<ThemeMode>,
}

/// The fully resolved configuration handed to an application at startup.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
pub struct ResolvedConfig {
    /// Settings shared across the suite.
    pub suite: SuiteConfig,
    /// Settings for this application.
    pub app: AppConfig,
}

impl ResolvedConfig {
    /// The theme this application should render in.
    ///
    /// An application-level theme wins over the suite default; that is the
    /// entire point of allowing the override.
    pub fn effective_theme(&self) -> ThemeMode {
        self.app.theme.unwrap_or(self.suite.theme)
    }
}
