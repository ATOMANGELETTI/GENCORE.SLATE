//! The provider for the suite's own applications.

use slate_core::{KnownApp, Vendor};
use slate_paths::SlatePaths;

use crate::provider::{AppDescriptor, AppProvider, ProviderError};

/// Finds the suite's own applications under `programs/gencore/slate/`.
///
/// Unlike the third-party providers, this one does not scan and parse
/// metadata: the suite knows exactly which applications it ships, so it checks
/// for each one's executable and reports what is actually present. A partially
/// extracted install therefore shows the applications that made it, rather
/// than an empty Launcher with no explanation.
#[derive(Debug, Default, Clone, Copy)]
pub struct NativeProvider;

impl NativeProvider {
    /// Creates the provider.
    pub fn new() -> Self {
        Self
    }
}

impl AppProvider for NativeProvider {
    fn vendor(&self) -> Vendor {
        Vendor::Gencore
    }

    fn discover(&self, paths: &SlatePaths) -> Result<Vec<AppDescriptor>, ProviderError> {
        let root = paths.root();
        let mut found = Vec::new();

        for app in KnownApp::ALL {
            // The Launcher is what is doing the discovering; listing it as
            // something to launch would be an invitation to start a second one.
            if app == KnownApp::Launcher {
                continue;
            }

            let id = app.id();
            let executable = paths.app_executable(&id);

            if !executable.is_file() {
                tracing::debug!(app = %id, "not installed; skipping");
                continue;
            }

            let Some(relative_executable) = relative_to(root, &executable) else {
                continue;
            };
            let Some(relative_directory) = relative_to(root, &paths.app_dir(&id)) else {
                continue;
            };

            found.push(AppDescriptor {
                display_name: app.display_name().to_owned(),
                icon_path: icon_for(paths, &id),
                version: Some(slate_core::version::SUITE_VERSION.to_owned()),
                relative_path: relative_directory,
                executable: relative_executable,
                vendor: Vendor::Gencore,
                id,
            });
        }

        Ok(found)
    }
}

/// Expresses an absolute path relative to the portable root, with forward
/// slashes so it is stable across the JSON boundary.
fn relative_to(root: &camino::Utf8Path, path: &camino::Utf8Path) -> Option<String> {
    path.strip_prefix(root)
        .ok()
        .map(|relative| relative.as_str().replace('\\', "/"))
}

/// The application's icon, if it ships one.
fn icon_for(paths: &SlatePaths, id: &slate_core::AppId) -> Option<String> {
    let icon = paths.app_dir(id).join("icons").join("icon.png");
    if icon.is_file() {
        relative_to(paths.root(), &icon)
    } else {
        None
    }
}
