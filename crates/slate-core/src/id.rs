//! Identifiers for applications and the vendors that supply them.

use core::fmt;

use serde::{Deserialize, Serialize};

use crate::error::SlateError;

/// An application identifier, used for directory names, log files, window
/// labels, and broker addressing.
///
/// Because it becomes a path segment, the format is validated on construction:
/// lower-case ASCII letters, digits, and hyphens, starting with a letter. That
/// rules out path traversal, casing collisions on a case-insensitive
/// filesystem, and names that need quoting.
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(try_from = "String", into = "String")]
pub struct AppId(String);

impl AppId {
    /// The longest identifier accepted. Generous for a name, short enough to
    /// keep nested paths well inside the Windows path limit.
    pub const MAX_LENGTH: usize = 64;

    /// Validates and creates an identifier.
    ///
    /// # Errors
    ///
    /// Returns [`SlateError::InvalidInput`] if the value is empty, too long,
    /// does not begin with a lower-case letter, or contains any character
    /// outside `[a-z0-9-]`.
    pub fn new(value: impl Into<String>) -> Result<Self, SlateError> {
        let value = value.into();

        if value.is_empty() {
            return Err(SlateError::InvalidInput("application id is empty".into()));
        }
        if value.len() > Self::MAX_LENGTH {
            return Err(SlateError::InvalidInput(format!(
                "application id {value:?} exceeds {} characters",
                Self::MAX_LENGTH
            )));
        }
        if !value.starts_with(|c: char| c.is_ascii_lowercase()) {
            return Err(SlateError::InvalidInput(format!(
                "application id {value:?} must start with a lower-case letter"
            )));
        }
        if !value
            .chars()
            .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
        {
            return Err(SlateError::InvalidInput(format!(
                "application id {value:?} may only contain a-z, 0-9, and '-'"
            )));
        }

        Ok(Self(value))
    }

    /// The identifier as a string slice.
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl fmt::Display for AppId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.0)
    }
}

impl TryFrom<String> for AppId {
    type Error = SlateError;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        Self::new(value)
    }
}

impl From<AppId> for String {
    fn from(value: AppId) -> Self {
        value.0
    }
}

/// The applications shipped as part of the suite itself.
///
/// Third-party applications have no variant here — they are described entirely
/// by data read from their vendor directory.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum KnownApp {
    /// The suite's launcher, which also hosts the IPC broker.
    Launcher,
    /// The terminal emulator.
    Terminal,
    /// The file manager.
    Explorer,
}

impl KnownApp {
    /// Every first-party application, in the order the Launcher presents them.
    pub const ALL: [Self; 3] = [Self::Launcher, Self::Terminal, Self::Explorer];

    /// The identifier used for directories, executables, and log files.
    pub fn id(self) -> AppId {
        AppId(
            match self {
                Self::Launcher => "slate-launcher",
                Self::Terminal => "slate-terminal",
                Self::Explorer => "slate-explorer",
            }
            .to_owned(),
        )
    }

    /// The name shown to the user.
    pub fn display_name(self) -> &'static str {
        match self {
            Self::Launcher => "Launcher",
            Self::Terminal => "Terminal",
            Self::Explorer => "Explorer",
        }
    }
}

/// A source of installed applications.
///
/// Each vendor owns a directory under `programs/` and keeps its own layout
/// conventions; the suite reads them through an adapter rather than
/// reorganising them.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Vendor {
    /// First-party applications: `programs/gencore/`.
    Gencore,
    /// PortableApps.com format: `programs/portableapps.com/`.
    PortableAppsCom,
    /// portapps.io format: `programs/portapps.io/`.
    PortappsIo,
}

impl Vendor {
    /// Every vendor the suite knows how to look in.
    pub const ALL: [Self; 3] = [Self::Gencore, Self::PortableAppsCom, Self::PortappsIo];

    /// The vendor's directory name under `programs/`.
    pub fn directory_name(self) -> &'static str {
        match self {
            Self::Gencore => "gencore",
            Self::PortableAppsCom => "portableapps.com",
            Self::PortappsIo => "portapps.io",
        }
    }

    /// The name shown to the user.
    pub fn display_name(self) -> &'static str {
        match self {
            Self::Gencore => "GENCORE",
            Self::PortableAppsCom => "PortableApps.com",
            Self::PortappsIo => "portapps.io",
        }
    }
}
