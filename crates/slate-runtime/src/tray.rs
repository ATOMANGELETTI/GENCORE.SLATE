//! The tray icon, and the window that draws its menu.
//!
//! # Why the menu is a window
//!
//! Tauri can attach a native [`tauri::menu::Menu`] to a tray icon, and doing so
//! would be a fraction of this code. It would also render as a plain Windows
//! menu strip: system colours, system metrics, system typeface. Beside a
//! Nord-coloured, Terminess-set application it reads as a different program
//! borrowing the tray icon.
//!
//! So the menu is a second webview window — undecorated, transparent, always on
//! top — rendering the same `MenuSurface` the in-window context menus use. The
//! costs are real and are accepted deliberately: the window has to be
//! positioned by hand, sized from a measurement the frontend reports back, and
//! dismissed on blur, none of which a native menu would have needed. See ADR
//! 0012.

use slate_core::SlateError;
use tauri::{
    Manager, Theme, WebviewWindow,
    image::Image,
    tray::{TrayIconBuilder, TrayIconEvent},
};

use crate::{MAIN_WINDOW, error::RuntimeError};

/// The label given to the window that draws the tray menu.
pub const TRAY_MENU_WINDOW: &str = "tray-menu";

/// The identifier of the tray icon itself.
const TRAY_ICON_ID: &str = "slate-tray";

/// One tray glyph in each of the two ink colours it needs.
///
/// Windows never tints a tray icon to match its own theme, so the suite has
/// to supply both and choose. A single light-ink icon — the situation before
/// this existed — disappears against the default light-mode taskbar; a single
/// dark-ink icon disappears against the far more common dark one. Confirmed
/// with Dustin: a light taskbar wants the dark icon, a dark taskbar wants the
/// light one — the ordinary Windows convention, and the one that actually
/// fixes the disappearing-icon report rather than reproducing it under a
/// different theme.
#[derive(Debug, Clone, Copy)]
pub struct TrayIcons {
    /// Light ink, for a dark taskbar (Windows dark theme).
    pub for_dark_theme: &'static [u8],
    /// Dark ink, for a light taskbar (Windows light theme).
    pub for_light_theme: &'static [u8],
}

impl TrayIcons {
    /// Picks the image whose ink is legible against the given OS theme.
    fn resolve(&self, theme: Theme) -> Result<Image<'static>, RuntimeError> {
        // `Theme` is `#[non_exhaustive]`; anything other than `Light` falls
        // back to the dark variant, which is the more common Windows 11
        // default and the suite's own default theme (ADR 0010).
        let bytes = if matches!(theme, Theme::Light) {
            self.for_light_theme
        } else {
            self.for_dark_theme
        };

        Image::from_bytes(bytes).map_err(|error| {
            RuntimeError::Window(format!("the tray icon could not be decoded: {error}"))
        })
    }
}

/// The width the popup opens at, before the frontend reports what it needs.
///
/// Matches `--slate-chrome-menuMinWidth`; the two are the same measurement
/// expressed on both sides of the boundary.
const INITIAL_WIDTH: f64 = 208.0;

/// The height the popup opens at. Deliberately small — the window is invisible
/// until it has been resized, so this only has to be non-zero.
const INITIAL_HEIGHT: f64 = 40.0;

/// The gap between the popup and the edge of the work area.
const EDGE_GAP: f64 = 8.0;

/// Installs the tray icon and builds the (hidden) window that draws its menu.
///
/// The window is created once at startup rather than per click: building a
/// webview takes long enough to be visible as a stutter between clicking the
/// tray and seeing a menu, which is exactly the kind of lag that makes a tray
/// icon feel bolted on.
///
/// `main_window` is used once, to read the OS theme the icon should start in
/// and to listen for it changing; the tray icon and the window it watches are
/// otherwise unrelated.
///
/// # Errors
///
/// Returns [`RuntimeError::Window`] if an icon or either window cannot be
/// built.
pub fn install(
    app: &tauri::App,
    main_window: &WebviewWindow,
    icons: TrayIcons,
    tooltip: &str,
) -> Result<(), RuntimeError> {
    let popup = build_popup_window(app)?;

    // Read the OS theme once, up front, rather than defaulting to one variant
    // and correcting it on the first `ThemeChanged` — that would show the
    // wrong icon, briefly but visibly, on every single launch.
    let initial_theme = main_window
        .theme()
        .map_err(|error| RuntimeError::Window(error.to_string()))?;

    TrayIconBuilder::with_id(TRAY_ICON_ID)
        .icon(icons.resolve(initial_theme)?)
        .tooltip(tooltip)
        // No native menu is attached, so Tauri must not try to show one.
        .show_menu_on_left_click(false)
        .on_tray_icon_event(|tray, event| {
            // `Down` rather than `Up`: a menu that appears on release lags
            // behind the click that asked for it.
            let TrayIconEvent::Click { rect, .. } = event else {
                return;
            };

            let app = tray.app_handle();
            if let Some(window) = app.get_webview_window(TRAY_MENU_WINDOW)
                && let Err(error) = show_popup_near(&window, rect.position, rect.size)
            {
                tracing::warn!(%error, "the tray menu could not be shown");
            }
        })
        .build(app)
        .map_err(|error| RuntimeError::Window(error.to_string()))?;

    // Dismiss on blur. A popup that outlives the click elsewhere that should
    // have closed it is the single most irritating way to get this wrong.
    let dismissable = popup.clone();
    popup.on_window_event(move |event| {
        if let tauri::WindowEvent::Focused(false) = event {
            let _ = dismissable.hide();
        }
    });

    // Swap the icon live when the user changes the Windows setting, rather
    // than only at the next launch. `tray_by_id` looks the icon back up
    // instead of holding a `TrayIcon` handle here, because this closure
    // outlives `install`'s own stack frame and the handle would have to be
    // threaded through some other piece of state for no benefit — the tray
    // icon is already kept alive by Tauri's own tray registry.
    let app_handle = app.handle().clone();
    main_window.on_window_event(move |event| {
        if let tauri::WindowEvent::ThemeChanged(theme) = event {
            let Some(tray) = app_handle.tray_by_id(TRAY_ICON_ID) else {
                return;
            };

            match icons.resolve(*theme) {
                Ok(image) => {
                    if let Err(error) = tray.set_icon(Some(image)) {
                        tracing::warn!(%error, "the tray icon could not be updated for the new theme");
                    }
                }
                Err(error) => tracing::warn!(%error, "the tray icon for the new theme could not be decoded"),
            }
        }
    });

    Ok(())
}

/// Creates the popup window, hidden.
fn build_popup_window(app: &tauri::App) -> Result<WebviewWindow, RuntimeError> {
    let state = app.state::<crate::SlateState>();
    // The same reasoning as the main window in `crate::setup`: without an
    // explicit data directory Tauri resolves one under `%LOCALAPPDATA%` and
    // creates it eagerly, which breaks the portability guarantee outright.
    let data_directory = state.paths().webview2_user_data_dir(state.app_id());

    tauri::WebviewWindowBuilder::new(
        app,
        TRAY_MENU_WINDOW,
        tauri::WebviewUrl::App("tray.html".into()),
    )
    .data_directory(data_directory.into_std_path_buf())
    .inner_size(INITIAL_WIDTH, INITIAL_HEIGHT)
    .decorations(false)
    .transparent(true)
    .always_on_top(true)
    .resizable(false)
    // A menu is not a window the user manages: it must not appear in the
    // taskbar, in Alt-Tab, or in a window list.
    .skip_taskbar(true)
    .shadow(false)
    .visible(false)
    .build()
    .map_err(|error| RuntimeError::Window(error.to_string()))
}

/// Positions the popup against the tray icon and shows it.
///
/// The taskbar is usually along the bottom, so the menu opens upward from the
/// icon; the position is clamped to the monitor either way, because a taskbar
/// can be on any edge and a menu drawn off-screen is simply lost.
fn show_popup_near(
    window: &WebviewWindow,
    // The tray reports these as the `Position`/`Size` enums rather than in a
    // concrete unit, because the notification area may sit on a monitor with a
    // different scale factor from the one the window was built on.
    icon_position: tauri::Position,
    icon_size: tauri::Size,
) -> Result<(), RuntimeError> {
    let to_error = |error: tauri::Error| RuntimeError::Window(error.to_string());

    let scale = window.scale_factor().map_err(to_error)?;
    let size = window
        .outer_size()
        .map_err(to_error)?
        .to_logical::<f64>(scale);
    let icon_position = icon_position.to_logical::<f64>(scale);
    let icon_size = icon_size.to_logical::<f64>(scale);

    // Centre on the icon horizontally, and sit above it.
    let mut x = icon_position.x + icon_size.width / 2.0 - size.width / 2.0;
    let mut y = icon_position.y - size.height - EDGE_GAP;

    if let Ok(Some(monitor)) = window.current_monitor() {
        let area = monitor.size().to_logical::<f64>(monitor.scale_factor());
        let origin = monitor.position().to_logical::<f64>(monitor.scale_factor());

        x = x.clamp(
            origin.x + EDGE_GAP,
            origin.x + area.width - size.width - EDGE_GAP,
        );

        // A taskbar at the top of the screen puts the icon near y = 0, where
        // there is no room above it.
        if y < origin.y {
            y = icon_position.y + icon_size.height + EDGE_GAP;
        }
    }

    window
        .set_position(tauri::LogicalPosition::new(x, y))
        .map_err(to_error)?;
    window.show().map_err(to_error)?;
    // Focus is what makes the blur handler above able to dismiss it.
    window.set_focus().map_err(to_error)?;

    Ok(())
}

/// Resizes the popup to the height its content actually needs, and repositions
/// it so it still sits against the tray icon.
///
/// The frontend measures rather than the backend calculating: the menu's height
/// depends on how many items an application contributes, on the type scale, and
/// on the user's zoom — none of which Rust can see.
///
/// # Errors
///
/// Returns [`SlateError::Internal`] if the window cannot be resized.
pub fn resize_popup(window: &WebviewWindow, width: f64, height: f64) -> Result<(), SlateError> {
    let to_error = |error: tauri::Error| SlateError::Internal(error.to_string());

    let previous = window
        .outer_position()
        .map_err(to_error)?
        .to_logical::<f64>(window.scale_factor().map_err(to_error)?);
    let old_height = window
        .outer_size()
        .map_err(to_error)?
        .to_logical::<f64>(window.scale_factor().map_err(to_error)?)
        .height;

    window
        .set_size(tauri::LogicalSize::new(width, height))
        .map_err(to_error)?;

    // Growing downward would push the menu over the taskbar it opened from, so
    // the bottom edge is what stays put.
    window
        .set_position(tauri::LogicalPosition::new(
            previous.x,
            previous.y + old_height - height,
        ))
        .map_err(to_error)?;

    Ok(())
}

/// Intercepts the main window's close so it hides to the tray instead.
///
/// Quitting stays possible, but only as an explicit choice from the tray menu.
/// Without this the tray icon would outlive nothing — the process would already
/// be gone — and the icon would be decoration.
pub fn attach_close_to_tray(window: &WebviewWindow) {
    let hidden = window.clone();

    window.on_window_event(move |event| {
        if let tauri::WindowEvent::CloseRequested { api, .. } = event {
            api.prevent_close();
            if let Err(error) = hidden.hide() {
                tracing::warn!(%error, "the window could not be hidden; leaving it open");
            }
        }
    });
}

/// Hides the tray popup, if it is showing.
pub fn dismiss_popup(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window(TRAY_MENU_WINDOW) {
        let _ = window.hide();
    }
}

/// The main window, for a tray action that needs to act on it.
pub fn main_window(app: &tauri::AppHandle) -> Option<WebviewWindow> {
    app.get_webview_window(MAIN_WINDOW)
}
