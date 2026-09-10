//! State the Launcher keeps that the shared runtime does not.

use std::sync::Mutex;

/// What the Launcher remembers about its own window.
///
/// Only one thing so far: how wide the window was before a view expanded it.
///
/// Recomputing the collapsed width by subtracting the expansion would be wrong
/// the moment a user drags the window wider while a view is open — the window
/// would then retract to a width it never had. Storing what it actually was is
/// the only way a retract is a restore rather than an arithmetic result.
#[derive(Debug, Default)]
pub struct LauncherState {
    collapsed_width: Mutex<Option<f64>>,
}

impl LauncherState {
    /// Records the width to return to, and reports whether one was already set.
    ///
    /// Already having one means the window is expanded, so a second expand is
    /// a no-op rather than a second widening — otherwise switching between two
    /// views would grow the window each time.
    pub fn remember_collapsed_width(&self, width: f64) -> bool {
        let Ok(mut stored) = self.collapsed_width.lock() else {
            // A poisoned lock means another thread panicked while holding it.
            // The width is a cosmetic convenience, so the right answer is to
            // behave as though nothing was remembered rather than to propagate
            // a panic into a window resize.
            return false;
        };

        let had_width = stored.is_some();
        if !had_width {
            *stored = Some(width);
        }

        had_width
    }

    /// Takes back the remembered width, clearing it.
    pub fn take_collapsed_width(&self) -> Option<f64> {
        self.collapsed_width.lock().ok()?.take()
    }

    /// Whether a view is currently holding the window open.
    pub fn is_expanded(&self) -> bool {
        self.collapsed_width
            .lock()
            .is_ok_and(|stored| stored.is_some())
    }
}
