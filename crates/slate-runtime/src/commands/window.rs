//! Window-chrome commands.
//!
//! The suite draws its own title bar (ADR 0010), so the operations a native
//! title bar would perform have to cross the IPC boundary. These are the only
//! window controls the frontend is given.

use slate_core::SlateError;
use tauri::{Manager, WebviewWindow};

use crate::state::SlateState;

/// Where the window is, as far as the user can tell.
///
/// Minimised and hidden are not independent of "on screen", and modelling them
/// as three separate booleans admits states that cannot exist — hidden *and*
/// visible, say. One enum makes the impossible combinations unrepresentable,
/// which is the same rule `.agents/rules/04-typescript.md` states for the
/// frontend: prefer a union once a third state becomes imaginable.
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub enum WindowVisibility {
    /// On screen.
    Visible,
    /// Minimised to the taskbar.
    Minimized,
    /// Hidden to the tray, with the process still running.
    Hidden,
}

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
    /// Whether the window is on screen, minimised, or hidden to the tray.
    ///
    /// Closing hides to the tray rather than exiting, so `Hidden` is a normal
    /// resting state here rather than a window on its way out.
    pub visibility: WindowVisibility,
    /// Whether the window is pinned above other windows.
    pub is_always_on_top: bool,
}

/// Reads the current window state.
///
/// # Errors
///
/// Returns [`SlateError::Internal`] if the window cannot be queried.
#[tauri::command]
pub fn slate_window_state(
    window: WebviewWindow,
    app: tauri::AppHandle,
) -> Result<WindowState, SlateError> {
    Ok(WindowState {
        is_maximized: window.is_maximized().map_err(to_error)?,
        is_focused: window.is_focused().map_err(to_error)?,
        visibility: if window.is_minimized().map_err(to_error)? {
            WindowVisibility::Minimized
        } else if window.is_visible().map_err(to_error)? {
            WindowVisibility::Visible
        } else {
            WindowVisibility::Hidden
        },
        // Tauri has no getter for this, so the value the frontend sees is the
        // one this process last set. It is stored rather than queried, which
        // means it survives a hide but not a restart — acceptable, because it
        // is deliberately not persisted to configuration either.
        is_always_on_top: app.state::<SlateState>().is_always_on_top(),
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
/// Closing hides to the tray rather than exiting: the suite keeps a tray icon
/// per application, and a tray icon for a process that has already gone is
/// worse than no tray icon at all. Quitting is an explicit choice, offered
/// only from the tray menu. The interception itself lives in
/// [`crate::tray::attach_close_to_tray`].
///
/// # Errors
///
/// Returns [`SlateError::Internal`] if the operation fails.
#[tauri::command]
pub fn slate_window_close(window: WebviewWindow) -> Result<(), SlateError> {
    window.close().map_err(to_error)
}

/// Hides the window, leaving the application running in the tray.
///
/// # Errors
///
/// Returns [`SlateError::Internal`] if the operation fails.
#[tauri::command]
pub fn slate_window_hide(window: WebviewWindow) -> Result<(), SlateError> {
    window.hide().map_err(to_error)
}

/// Shows the window and brings it forward.
///
/// Unminimises first: a window restored from the tray while minimised would
/// otherwise become visible without ever appearing on screen.
///
/// # Errors
///
/// Returns [`SlateError::Internal`] if the operation fails.
#[tauri::command]
pub fn slate_window_show(window: WebviewWindow) -> Result<(), SlateError> {
    if window.is_minimized().map_err(to_error)? {
        window.unminimize().map_err(to_error)?;
    }
    window.show().map_err(to_error)?;
    window.set_focus().map_err(to_error)
}

/// Pins the window above other windows, or releases it.
///
/// Returns the state after the change so the frontend does not have to ask.
///
/// # Errors
///
/// Returns [`SlateError::Internal`] if the operation fails.
#[tauri::command]
pub fn slate_window_set_always_on_top(
    window: WebviewWindow,
    app: tauri::AppHandle,
    is_enabled: bool,
) -> Result<bool, SlateError> {
    window.set_always_on_top(is_enabled).map_err(to_error)?;
    app.state::<SlateState>().set_always_on_top(is_enabled);

    Ok(is_enabled)
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
