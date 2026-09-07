//! The application provider model.

use serde::{Deserialize, Serialize};
use slate_core::{AppId, SlateError, Vendor};
use slate_paths::SlatePaths;

/// An application the Launcher can show and start.
///
/// Every path is **relative to the portable root**. An absolute path would
/// break the moment the install is copied to another drive, which is the one
/// thing this product must survive.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppDescriptor {
    /// Stable identifier, unique across every vendor.
    pub id: AppId,
    /// Which vendor directory it came from.
    pub vendor: Vendor,
    /// The name shown to the user.
    pub display_name: String,
    /// The application's directory, relative to the portable root.
    pub relative_path: String,
    /// The executable, relative to the portable root.
    pub executable: String,
    /// Version string, if the vendor's metadata provides one.
    pub version: Option<String>,
    /// An icon, relative to the portable root.
    pub icon_path: Option<String>,
}

/// Something went wrong discovering applications.
#[derive(Debug, thiserror::Error)]
pub enum ProviderError {
    /// The vendor directory could not be read.
    ///
    /// Not fatal: a vendor directory that is missing simply means nothing is
    /// installed from that source, which is the normal state of a fresh
    /// install.
    #[error("could not read the {vendor:?} directory: {reason}")]
    Unreadable {
        /// The vendor.
        vendor: Vendor,
        /// The underlying failure.
        reason: String,
    },

    /// An application's metadata was malformed.
    #[error("{path} has unusable metadata: {reason}")]
    Malformed {
        /// The offending path, relative to the portable root.
        path: String,
        /// What was wrong.
        reason: String,
    },
}

impl From<ProviderError> for SlateError {
    fn from(error: ProviderError) -> Self {
        Self::Internal(error.to_string())
    }
}

/// A source of installed applications.
///
/// One implementation per vendor directory. Each vendor keeps its own layout
/// conventions and the adapter reads them as they are — PortableApps.com's
/// `appinfo.ini` structure stays exactly as that ecosystem expects, because a
/// suite that reorganises other people's installs is a suite that breaks their
/// updaters.
pub trait AppProvider: Send + Sync {
    /// Which vendor this provider reads.
    fn vendor(&self) -> Vendor;

    /// Finds every application this provider can see.
    ///
    /// A provider whose directory does not exist returns an empty list rather
    /// than an error: nothing installed is a normal state, not a fault.
    ///
    /// # Errors
    ///
    /// Returns [`ProviderError::Unreadable`] only when the directory exists
    /// but cannot be read.
    fn discover(&self, paths: &SlatePaths) -> Result<Vec<AppDescriptor>, ProviderError>;
}
