//! Widening the window when a view opens, and retracting it when one closes.

use slate_core::SlateError;
use tauri::{LogicalPosition, LogicalSize, Manager, WebviewWindow};

use crate::state::LauncherState;

/// How much wider the window becomes when a view opens, in logical pixels.
///
/// The same number as `CHROME.windowExpansion` in
/// `packages/slate-tokens/src/tokens/layout.tokens.ts`, which is what the
/// frontend lays the view out against. The two have to agree, and there is no
/// mechanism that makes them — a mismatch shows up as a view that is narrower
/// than the space it was given, or wider than the window that holds it.
const EXPANSION: f64 = 180.0;

/// Widens or retracts the window for an expanded view.
///
/// Three things make this more than a `set_size` call.
///
/// **It remembers rather than calculates.** The collapsed width is stored on
/// the way out and restored on the way back, so a user who drags the window
/// wider while a view is open keeps that width instead of having 180 pixels
/// subtracted from it.
///
/// **It stays on screen.** Growing rightward from a window already near the
/// right edge of the display would push part of it off. When that would
/// happen, the window moves left by the overflow instead — which is what a
/// user expects a window that grows to do, rather than becoming partly
/// unreachable.
///
/// **It does nothing while maximised.** A maximised window has no width to
/// give, and resizing one silently un-maximises it on Windows.
///
/// # Errors
///
/// Returns [`SlateError::Internal`] if the window cannot be measured, moved or
/// resized.
#[tauri::command]
pub fn slate_launcher_set_expanded(
    window: WebviewWindow,
    app: tauri::AppHandle,
    is_expanded: bool,
) -> Result<(), SlateError> {
    if window.is_maximized().map_err(to_error)? {
        return Ok(());
    }

    let state = app.state::<LauncherState>();
    let scale = window.scale_factor().map_err(to_error)?;
    let size = window
        .inner_size()
        .map_err(to_error)?
        .to_logical::<f64>(scale);

    let target_width = if is_expanded {
        // Already expanded: switching between two views must not widen twice.
        if state.remember_collapsed_width(size.width) {
            return Ok(());
        }
        size.width + EXPANSION
    } else {
        match state.take_collapsed_width() {
            Some(width) => width,
            // Nothing remembered means the window was never expanded, so
            // there is nothing to undo.
            None => return Ok(()),
        }
    };

    window
        .set_size(LogicalSize::new(target_width, size.height))
        .map_err(to_error)?;

    if is_expanded {
        keep_on_screen(&window, target_width, scale)?;
    }

    Ok(())
}

/// Moves the window left if growing pushed it past the right edge of its
/// display.
///
/// Best-effort: a window with no monitor Tauri can name is left where it is.
/// Being unable to find the work area is not a reason to refuse to open a view.
fn keep_on_screen(window: &WebviewWindow, width: f64, scale: f64) -> Result<(), SlateError> {
    let Some(monitor) = window.current_monitor().map_err(to_error)? else {
        return Ok(());
    };

    let monitor_position = monitor.position().to_logical::<f64>(scale);
    let monitor_size = monitor.size().to_logical::<f64>(scale);
    let position = window
        .outer_position()
        .map_err(to_error)?
        .to_logical::<f64>(scale);

    let right_edge = monitor_position.x + monitor_size.width;
    let overflow = (position.x + width) - right_edge;

    if overflow > 0.0 {
        // Never past the left edge of the display: a window shifted off the
        // other side is no more reachable than one shifted off this one.
        let x = (position.x - overflow).max(monitor_position.x);
        window
            .set_position(LogicalPosition::new(x, position.y))
            .map_err(to_error)?;
    }

    Ok(())
}

fn to_error(error: tauri::Error) -> SlateError {
    SlateError::Internal(error.to_string())
}
