//! Commands the tray-menu window uses to drive itself.
//!
//! The menu is a webview window rather than a native menu (ADR 0012), so the
//! three things a native menu would have done for free — size itself, close
//! itself, and act on the application — each need a command.

use slate_core::SlateError;
use tauri::WebviewWindow;

use crate::tray;

/// Reports the size the menu's content actually needs.
///
/// Called by the tray window once after it paints. Rust cannot compute this:
/// the height depends on how many items the application contributed, on the
/// type scale, and on the user's zoom.
///
/// # Errors
///
/// Returns [`SlateError::InvalidInput`] if the reported size is not a sane
/// measurement, and [`SlateError::Internal`] if the window cannot be resized.
#[tauri::command]
pub fn slate_tray_menu_ready(
    window: WebviewWindow,
    width: f64,
    height: f64,
) -> Result<(), SlateError> {
    // The value crosses the IPC boundary from a webview, so it is input and
    // gets checked like any other. A zero or absurd size would leave the menu
    // invisible or covering the screen, with nothing to explain why.
    if !(width.is_finite() && height.is_finite()) || width <= 0.0 || height <= 0.0 {
        return Err(SlateError::InvalidInput(format!(
            "the tray menu reported an unusable size: {width}x{height}"
        )));
    }

    if width > 1024.0 || height > 2048.0 {
        return Err(SlateError::InvalidInput(format!(
            "the tray menu reported an implausible size: {width}x{height}"
        )));
    }

    tray::resize_popup(&window, width, height)
}

/// Hides the tray menu.
///
/// Used for Escape and for an item that has finished acting, so the menu goes
/// away at the moment the choice is made rather than when focus happens to
/// move.
#[tauri::command]
pub fn slate_tray_menu_dismiss(app: tauri::AppHandle) {
    tray::dismiss_popup(&app);
}

/// Shows the main window and brings it forward, from the tray.
///
/// # Errors
///
/// Returns [`SlateError::NotFound`] if the main window is gone, and
/// [`SlateError::Internal`] if it cannot be shown.
#[tauri::command]
pub fn slate_tray_show_main_window(app: tauri::AppHandle) -> Result<(), SlateError> {
    tray::dismiss_popup(&app);

    let window = tray::main_window(&app)
        .ok_or_else(|| SlateError::NotFound("the main window no longer exists".to_owned()))?;

    let to_error = |error: tauri::Error| SlateError::Internal(error.to_string());

    if window.is_minimized().map_err(to_error)? {
        window.unminimize().map_err(to_error)?;
    }
    window.show().map_err(to_error)?;
    window.set_focus().map_err(to_error)
}

/// Quits the application.
///
/// The only way out of the process: closing the window hides it to the tray
/// instead (see [`crate::tray::attach_close_to_tray`]), so this is the
/// deliberate choice that ends it.
#[tauri::command]
pub fn slate_tray_quit(app: tauri::AppHandle) {
    tray::dismiss_popup(&app);
    app.exit(0);
}

/// Whether the main window is currently on screen.
///
/// The tray menu offers "Hide" or "Show" depending, and asking at the moment
/// the menu opens is the only way to be right — the window may have been
/// closed to the tray since the menu last rendered.
///
/// # Errors
///
/// Returns [`SlateError::NotFound`] if the main window is gone.
#[tauri::command]
pub fn slate_tray_main_window_is_visible(app: tauri::AppHandle) -> Result<bool, SlateError> {
    let window = tray::main_window(&app)
        .ok_or_else(|| SlateError::NotFound("the main window no longer exists".to_owned()))?;

    window
        .is_visible()
        .map_err(|error| SlateError::Internal(error.to_string()))
}

/// Hides the main window to the tray.
///
/// # Errors
///
/// Returns [`SlateError::NotFound`] if the main window is gone, and
/// [`SlateError::Internal`] if it cannot be hidden.
#[tauri::command]
pub fn slate_tray_hide_main_window(app: tauri::AppHandle) -> Result<(), SlateError> {
    tray::dismiss_popup(&app);

    let window = tray::main_window(&app)
        .ok_or_else(|| SlateError::NotFound("the main window no longer exists".to_owned()))?;

    window
        .hide()
        .map_err(|error| SlateError::Internal(error.to_string()))
}
