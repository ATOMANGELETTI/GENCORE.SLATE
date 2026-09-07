//! Window-chrome commands.
//!
//! The suite draws its own title bar (ADR 0010), so the operations a native
//! title bar would perform have to cross the IPC boundary. These are the only
//! window controls the frontend is given.

use slate_core::SlateError;
use tauri::{Manager, WebviewWindow};

use crate::state::SlateState;

/// Everything the frontend needs to render the title bar correctly.
#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowState {
    /// Whether the window fills the work area.
    pub is_maximized: bool,
    /// Whether the window currently has focus.
    ///
    /// The traffic lights carry colour only while focused and desaturate
    /// otherwise — the detail that makes the chrome read as deliberate.
    pub is_focused: bool,
    /// Whether the window is minimised.
    pub is_minimized: bool,
}

/// Reads the current window state.
///
/// # Errors
///
/// Returns [`SlateError::Internal`] if the window cannot be queried.
#[tauri::command]
pub fn slate_window_state(window: WebviewWindow) -> Result<WindowState, SlateError> {
    Ok(WindowState {
        is_maximized: window.is_maximized().map_err(to_error)?,
        is_focused: window.is_focused().map_err(to_error)?,
        is_minimized: window.is_minimized().map_err(to_error)?,
    })
}

/// Minimises the window.
///
/// # Errors
///
/// Returns [`SlateError::Internal`] if the operation fails.
#[tauri::command]
pub fn slate_window_minimize(window: WebviewWindow) -> Result<(), SlateError> {
    window.minimize().map_err(to_error)
}

/// Toggles between maximised and restored — the macOS "zoom" behaviour.
///
/// Returns the state after toggling so the frontend does not have to ask again.
///
/// # Errors
///
/// Returns [`SlateError::Internal`] if the operation fails.
#[tauri::command]
pub fn slate_window_toggle_maximize(window: WebviewWindow) -> Result<bool, SlateError> {
    if window.is_maximized().map_err(to_error)? {
        window.unmaximize().map_err(to_error)?;
        Ok(false)
    } else {
        window.maximize().map_err(to_error)?;
        Ok(true)
    }
}

/// Closes the window.
///
/// # Errors
///
/// Returns [`SlateError::Internal`] if the operation fails.
#[tauri::command]
pub fn slate_window_close(window: WebviewWindow) -> Result<(), SlateError> {
    window.close().map_err(to_error)
}

/// Begins a drag initiated from the custom title bar.
///
/// # Errors
///
/// Returns [`SlateError::Internal`] if the operation fails.
#[tauri::command]
pub fn slate_window_start_drag(window: WebviewWindow) -> Result<(), SlateError> {
    window.start_dragging().map_err(to_error)
}

/// Persists the window's geometry so it reopens where the user left it.
///
/// This matters more than usual: custom chrome means Windows Snap Layouts are
/// unavailable, so a window that forgets its position is a window the user has
/// to reposition every launch.
///
/// # Errors
///
/// Returns [`SlateError::Config`] if the configuration cannot be written.
#[tauri::command]
pub fn slate_window_persist_geometry(
    window: WebviewWindow,
    app: tauri::AppHandle,
) -> Result<(), SlateError> {
    let state = app.state::<SlateState>();

    let is_maximized = window.is_maximized().map_err(to_error)?;
    let scale = window.scale_factor().map_err(to_error)?;
    let size = window
        .inner_size()
        .map_err(to_error)?
        .to_logical::<f64>(scale);
    let position = window
        .outer_position()
        .map_err(to_error)?
        .to_logical::<f64>(scale);

    state.update_config(|config| {
        config.window.maximized = is_maximized;
        // Storing the size of a maximised window would make it reopen filling
        // the screen and then "restore" to the same size.
        if !is_maximized {
            config.window.width = size.width;
            config.window.height = size.height;
            config.window.x = Some(position.x);
            config.window.y = Some(position.y);
        }
    })?;

    Ok(())
}

fn to_error(error: tauri::Error) -> SlateError {
    SlateError::Internal(error.to_string())
}
