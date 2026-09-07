//! Combining every provider into one list of applications.

use slate_paths::SlatePaths;

use crate::native::NativeProvider;
use crate::provider::{AppDescriptor, AppProvider};

/// Every provider the Launcher consults.
pub struct Registry {
    providers: Vec<Box<dyn AppProvider>>,
}

impl Registry {
    /// Builds a registry from the providers that are implemented.
    pub fn with_default_providers() -> Self {
        Self {
            providers: vec![Box::new(NativeProvider::new())],
        }
    }

    /// Builds a registry from an explicit list.
    pub fn new(providers: Vec<Box<dyn AppProvider>>) -> Self {
        Self { providers }
    }

    /// Adds a provider.
    pub fn register(&mut self, provider: Box<dyn AppProvider>) {
        self.providers.push(provider);
    }

    /// Discovers every application across every provider.
    ///
    /// A provider that fails is logged and skipped rather than failing the
    /// whole discovery: one unreadable vendor directory must not leave the
    /// user with an empty Launcher and no way to start anything.
    ///
    /// Results are ordered by vendor, then by display name, so the list does
    /// not reshuffle between runs because a filesystem enumerated differently.
    pub fn discover(&self, paths: &SlatePaths) -> Vec<AppDescriptor> {
        let mut apps = Vec::new();

        for provider in &self.providers {
            match provider.discover(paths) {
                Ok(found) => apps.extend(found),
                Err(error) => {
                    tracing::warn!(
                        vendor = ?provider.vendor(),
                        %error,
                        "skipping a provider that could not be read",
                    );
                }
            }
        }

        apps.sort_by(|left, right| {
            left.vendor.cmp(&right.vendor).then_with(|| {
                left.display_name
                    .to_lowercase()
                    .cmp(&right.display_name.to_lowercase())
            })
        });

        apps
    }

    /// How many providers are registered.
    pub fn provider_count(&self) -> usize {
        self.providers.len()
    }
}

impl Default for Registry {
    fn default() -> Self {
        Self::with_default_providers()
    }
}

impl std::fmt::Debug for Registry {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Registry")
            .field(
                "providers",
                &self
                    .providers
                    .iter()
                    .map(|p| p.vendor())
                    .collect::<Vec<_>>(),
            )
            .finish()
    }
}
