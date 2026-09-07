//! Applying the suite's window chrome.

use slate_config::{ResolvedConfig, ThemeMode, WindowMaterial};
use tauri::{LogicalPosition, LogicalSize, WebviewWindow};

use crate::error::RuntimeError;

/// Restores geometry, applies translucency, and shows the window.
///
/// The window is created hidden in `tauri.conf.json` and shown here, once it
/// has been positioned and its material applied. Showing it first produces a
/// visible flash as it jumps to its remembered position and repaints — small,
/// but exactly the kind of detail that separates a considered application from
/// an assembled one.
///
/// # Errors
///
/// Returns [`RuntimeError::Window`] if geometry cannot be applied or the
/// window cannot be shown. Translucency failures are logged, not returned:
/// falling back to a solid background is a cosmetic downgrade, never a reason
/// to refuse to start.
pub fn apply_chrome(window: &WebviewWindow, config: &ResolvedConfig) -> Result<(), RuntimeError> {
    restore_geometry(window, config)?;
    apply_material(window, config);

    window
        .show()
        .map_err(|error| RuntimeError::Window(error.to_string()))?;
    window
        .set_focus()
        .map_err(|error| RuntimeError::Window(error.to_string()))?;

    Ok(())
}

/// Restores the size and position recorded when the window last closed.
fn restore_geometry(window: &WebviewWindow, config: &ResolvedConfig) -> Result<(), RuntimeError> {
    let geometry = &config.app.window;

    window
        .set_size(LogicalSize::new(geometry.width, geometry.height))
        .map_err(|error| RuntimeError::Window(error.to_string()))?;

    if let (Some(x), Some(y)) = (geometry.x, geometry.y) {
        // A saved position can be off-screen if the user unplugged a monitor,
        // so it is only honoured when it still lands on a visible display.
        if is_on_a_visible_monitor(window, x, y) {
            window
                .set_position(LogicalPosition::new(x, y))
                .map_err(|error| RuntimeError::Window(error.to_string()))?;
        } else {
            tracing::debug!(
                x,
                y,
                "saved window position is off-screen; centring instead"
            );
            window
                .center()
                .map_err(|error| RuntimeError::Window(error.to_string()))?;
        }
    } else {
        window
            .center()
            .map_err(|error| RuntimeError::Window(error.to_string()))?;
    }

    if geometry.maximized {
        window
            .maximize()
            .map_err(|error| RuntimeError::Window(error.to_string()))?;
    }

    Ok(())
}

/// Whether the given logical point falls inside a currently connected monitor.
fn is_on_a_visible_monitor(window: &WebviewWindow, x: f64, y: f64) -> bool {
    let Ok(monitors) = window.available_monitors() else {
        return false;
    };
    let Ok(scale) = window.scale_factor() else {
        return false;
    };

    monitors.iter().any(|monitor| {
        let position = monitor.position().to_logical::<f64>(scale);
        let size = monitor.size().to_logical::<f64>(scale);

        x >= position.x
            && y >= position.y
            && x < position.x + size.width
            && y < position.y + size.height
    })
}

/// Applies Mica or Acrylic where the platform supports it.
///
/// Both need Windows 11. On anything older the call fails and the window keeps
/// the solid token background the stylesheet already provides, which is why
/// this returns nothing and only logs.
fn apply_material(window: &WebviewWindow, config: &ResolvedConfig) {
    let is_dark = matches!(config.effective_theme(), ThemeMode::Dark);

    #[cfg(windows)]
    {
        use window_vibrancy::{apply_acrylic, apply_mica};

        let outcome = match config.suite.material {
            WindowMaterial::Solid => return,
            WindowMaterial::Mica => apply_mica(window, Some(is_dark)).map_err(|e| e.to_string()),
            WindowMaterial::Acrylic => {
                apply_acrylic(window, Some((0, 0, 0, 0))).map_err(|e| e.to_string())
            }
        };

        match outcome {
            Ok(()) => tracing::debug!(material = ?config.suite.material, "window material applied"),
            Err(error) => tracing::info!(
                %error,
                "window translucency unavailable; using a solid background"
            ),
        }
    }

    #[cfg(not(windows))]
    {
        let _ = (window, is_dark);
        tracing::debug!("window materials are a Windows feature; using a solid background");
    }
}
