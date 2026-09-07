//! The `.slate-root` marker file that identifies a portable root.

use camino::{Utf8Path, Utf8PathBuf};
use serde::{Deserialize, Serialize};
use slate_core::{SCHEMA_VERSION, SuiteVersion};

use crate::error::PathsError;

/// The file name that marks a directory as a portable root.
pub const MARKER_FILE: &str = ".slate-root";

/// The parsed contents of `.slate-root`.
///
/// The file is written by `scripts/bun-package.ts` and read at startup. It is
/// self-describing on purpose: support and tooling can identify an install
/// without running anything from it.
#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
pub struct RootMarker {
    /// Which build produced this install.
    pub suite: SuiteSection,
    /// Where the top-level directories live, relative to the root.
    #[serde(default)]
    pub layout: LayoutSection,
}

/// The `[suite]` section of the marker.
#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
pub struct SuiteSection {
    /// The suite version, as `major.minor.patch`.
    pub version: String,
    /// An opaque identifier for the build that produced this tree.
    #[serde(default)]
    pub build_id: String,
    /// The layout schema version — see [`slate_core::SCHEMA_VERSION`].
    pub schema_version: u16,
}

/// The `[layout]` section of the marker.
///
/// Present so a future layout change can be described by data rather than
/// requiring every binary to be rebuilt with new constants.
#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
pub struct LayoutSection {
    /// Directory holding everything the suite writes.
    pub appdata: String,
    /// Directory holding installed applications.
    pub programs: String,
    /// Directory holding the user's own files.
    pub storage: String,
}

impl Default for LayoutSection {
    fn default() -> Self {
        Self {
            appdata: "appdata".to_owned(),
            programs: "programs".to_owned(),
            storage: "storage".to_owned(),
        }
    }
}

impl RootMarker {
    /// Reads and validates the marker in `root`.
    ///
    /// # Errors
    ///
    /// Returns [`PathsError::InvalidRoot`] if the marker is missing,
    /// [`PathsError::MalformedMarker`] if it cannot be parsed, and
    /// [`PathsError::UnsupportedSchema`] if it was written by a layout version
    /// this binary does not understand.
    pub fn load(root: &Utf8Path) -> Result<Self, PathsError> {
        let path = root.join(MARKER_FILE);

        let contents = std::fs::read_to_string(&path).map_err(|error| PathsError::InvalidRoot {
            root: root.to_owned(),
            reason: format!("cannot read {MARKER_FILE}: {error}"),
        })?;

        let marker: Self =
            toml::from_str(&contents).map_err(|error| PathsError::MalformedMarker {
                path: path.clone(),
                reason: error.to_string(),
            })?;

        if marker.suite.schema_version > SCHEMA_VERSION {
            return Err(PathsError::UnsupportedSchema {
                found: marker.suite.schema_version,
                expected: SCHEMA_VERSION,
            });
        }

        Ok(marker)
    }

    /// Whether `root` looks like a portable root.
    ///
    /// Only checks for the marker's presence — use [`RootMarker::load`] when
    /// the contents matter.
    pub fn exists_in(root: &Utf8Path) -> bool {
        root.join(MARKER_FILE).is_file()
    }

    /// The suite version recorded in the marker, if it parses.
    pub fn version(&self) -> Option<SuiteVersion> {
        SuiteVersion::parse(&self.suite.version)
    }

    /// The absolute path of the marker within `root`.
    pub fn path_in(root: &Utf8Path) -> Utf8PathBuf {
        root.join(MARKER_FILE)
    }
}
