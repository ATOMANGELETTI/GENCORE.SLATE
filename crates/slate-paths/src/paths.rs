//! Every path the suite uses, derived from one portable root.

use camino::{Utf8Component, Utf8Path, Utf8PathBuf};
use serde::{Deserialize, Serialize};
use slate_core::{AppId, Vendor};

use crate::discover::{discover_root, validate_root};
use crate::error::PathsError;
use crate::marker::RootMarker;

/// A directory in the user's portable `storage/` tree.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum StorageKind {
    /// `storage/desktop`
    Desktop,
    /// `storage/documents`
    Documents,
    /// `storage/downloads`
    Downloads,
    /// `storage/music`
    Music,
    /// `storage/pictures`
    Pictures,
    /// `storage/videos`
    Videos,
}

impl StorageKind {
    /// Every storage directory, in the order the Explorer presents them.
    pub const ALL: [Self; 6] = [
        Self::Desktop,
        Self::Documents,
        Self::Downloads,
        Self::Music,
        Self::Pictures,
        Self::Videos,
    ];

    /// The directory name under `storage/`.
    pub fn directory_name(self) -> &'static str {
        match self {
            Self::Desktop => "desktop",
            Self::Documents => "documents",
            Self::Downloads => "downloads",
            Self::Music => "music",
            Self::Pictures => "pictures",
            Self::Videos => "videos",
        }
    }

    /// The name shown to the user.
    pub fn display_name(self) -> &'static str {
        match self {
            Self::Desktop => "Desktop",
            Self::Documents => "Documents",
            Self::Downloads => "Downloads",
            Self::Music => "Music",
            Self::Pictures => "Pictures",
            Self::Videos => "Videos",
        }
    }
}

/// The resolved paths of one portable install.
///
/// Construct this once at startup and pass it down. **Every** path in the
/// suite comes from here — see `.agents/rules/09-portability.md`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SlatePaths {
    root: Utf8PathBuf,
    appdata: Utf8PathBuf,
    programs: Utf8PathBuf,
    storage: Utf8PathBuf,
    marker: RootMarker,
}

impl SlatePaths {
    /// Locates the portable root and resolves the layout.
    ///
    /// # Errors
    ///
    /// Propagates whatever [`discover_root`] reports — most usefully
    /// [`PathsError::RootNotFound`], which names every location searched.
    pub fn discover() -> Result<Self, PathsError> {
        let root = discover_root()?;
        Self::from_root(root)
    }

    /// Resolves the layout for an explicitly named root.
    ///
    /// # Errors
    ///
    /// Returns [`PathsError::InvalidRoot`] if the directory is not a portable
    /// root, or [`PathsError::UnsupportedSchema`] if its layout is newer than
    /// this binary understands.
    pub fn from_root(root: impl Into<Utf8PathBuf>) -> Result<Self, PathsError> {
        let root = root.into();
        validate_root(&root)?;

        let marker = RootMarker::load(&root)?;
        let appdata = root.join(&marker.layout.appdata);
        let programs = root.join(&marker.layout.programs);
        let storage = root.join(&marker.layout.storage);

        Ok(Self {
            root,
            appdata,
            programs,
            storage,
            marker,
        })
    }

    // ── Top level ────────────────────────────────────────────────────────────

    /// The portable root. Nothing outside this directory is ever touched.
    pub fn root(&self) -> &Utf8Path {
        &self.root
    }

    /// The parsed `.slate-root` marker.
    pub fn marker(&self) -> &RootMarker {
        &self.marker
    }

    /// Everything the suite writes: configuration, database, logs, runtimes.
    pub fn appdata_dir(&self) -> &Utf8Path {
        &self.appdata
    }

    /// Installed applications, grouped by vendor.
    pub fn programs_dir(&self) -> &Utf8Path {
        &self.programs
    }

    /// The user's own files.
    pub fn storage_dir(&self) -> &Utf8Path {
        &self.storage
    }

    // ── appdata ──────────────────────────────────────────────────────────────

    /// TOML configuration: `appdata/config`.
    pub fn config_dir(&self) -> Utf8PathBuf {
        self.appdata.join("config")
    }

    /// The configuration file for one application.
    pub fn config_file(&self, app_id: &AppId) -> Utf8PathBuf {
        self.config_dir().join(format!("{app_id}.toml"))
    }

    /// Settings shared by every application.
    pub fn suite_config_file(&self) -> Utf8PathBuf {
        self.config_dir().join("suite.toml")
    }

    /// SQLite databases: `appdata/database`.
    pub fn database_dir(&self) -> Utf8PathBuf {
        self.appdata.join("database")
    }

    /// The suite's primary database file.
    pub fn database_file(&self) -> Utf8PathBuf {
        self.database_dir().join("slate.db")
    }

    /// Rolling logs: `appdata/logs`.
    pub fn logs_dir(&self) -> Utf8PathBuf {
        self.appdata.join("logs")
    }

    /// Shared assets: `appdata/resources`.
    pub fn resources_dir(&self) -> Utf8PathBuf {
        self.appdata.join("resources")
    }

    /// Bundled binaries: `appdata/binaries`.
    pub fn binaries_dir(&self) -> Utf8PathBuf {
        self.appdata.join("binaries")
    }

    /// The bundled fixed-version WebView2 runtime.
    ///
    /// Assigned to `WEBVIEW2_BROWSER_EXECUTABLE_FOLDER` before any window is
    /// created — see ADR 0005.
    pub fn webview2_runtime_dir(&self) -> Utf8PathBuf {
        self.binaries_dir().join("webview2")
    }

    /// WebView2's per-application user-data directory.
    ///
    /// Assigned to `WEBVIEW2_USER_DATA_FOLDER`. Without it WebView2 writes
    /// outside the portable root and the whole promise is broken.
    pub fn webview2_user_data_dir(&self, app_id: &AppId) -> Utf8PathBuf {
        self.appdata.join("webview2").join(app_id.as_str())
    }

    // ── programs ─────────────────────────────────────────────────────────────

    /// A vendor's directory under `programs/`.
    pub fn vendor_dir(&self, vendor: Vendor) -> Utf8PathBuf {
        self.programs.join(vendor.directory_name())
    }

    /// The directory holding the suite's own applications.
    pub fn suite_programs_dir(&self) -> Utf8PathBuf {
        self.vendor_dir(Vendor::Gencore).join("slate")
    }

    /// One first-party application's directory.
    pub fn app_dir(&self, app_id: &AppId) -> Utf8PathBuf {
        self.suite_programs_dir().join(app_id.as_str())
    }

    /// One first-party application's executable.
    pub fn app_executable(&self, app_id: &AppId) -> Utf8PathBuf {
        self.app_dir(app_id).join(format!("{app_id}.exe"))
    }

    // ── storage ──────────────────────────────────────────────────────────────

    /// One of the user's storage directories.
    pub fn storage(&self, kind: StorageKind) -> Utf8PathBuf {
        self.storage.join(kind.directory_name())
    }

    // ── Safety ───────────────────────────────────────────────────────────────

    /// Joins `relative` onto `base` and refuses anything that leaves the root.
    ///
    /// This is the guard behind every path that originates outside the
    /// process — a command argument from the webview, an entry in a
    /// third-party manifest, a value read from the database.
    ///
    /// Normalisation is lexical: `..` components are resolved without touching
    /// the filesystem, so a path that does not exist yet can still be checked.
    /// Absolute inputs are rejected outright rather than being reinterpreted.
    ///
    /// Filesystem canonicalisation is deliberately avoided — see `normalise`.
    ///
    /// # Errors
    ///
    /// Returns [`PathsError::EscapesRoot`] if the result would fall outside
    /// the portable root. This is always an error and never a clamp: rewriting
    /// the path to something the caller did not ask for would hide the defect
    /// instead of surfacing it.
    pub fn resolve_within(
        &self,
        base: &Utf8Path,
        relative: impl AsRef<Utf8Path>,
    ) -> Result<Utf8PathBuf, PathsError> {
        let relative = relative.as_ref();

        let candidate = if relative.is_absolute() {
            relative.to_owned()
        } else {
            normalise(&base.join(relative))
        };

        let normalised = normalise(&candidate);
        let root = normalise(&self.root);

        if !normalised.starts_with(&root) {
            return Err(PathsError::EscapesRoot {
                path: normalised,
                root,
            });
        }

        Ok(normalised)
    }

    /// Whether `path` lies inside the portable root.
    pub fn contains(&self, path: &Utf8Path) -> bool {
        normalise(path).starts_with(normalise(&self.root))
    }

    /// Creates every directory the layout expects, if it is not already there.
    ///
    /// Called once at startup so a partially populated install — a user who
    /// deleted an empty folder, or a zip extracted by a tool that skips them —
    /// repairs itself rather than failing later.
    ///
    /// # Errors
    ///
    /// Returns [`PathsError::CreateFailed`] naming the first directory that
    /// could not be created.
    pub fn ensure_layout(&self) -> Result<(), PathsError> {
        let mut directories = vec![
            self.config_dir(),
            self.database_dir(),
            self.logs_dir(),
            self.resources_dir(),
            self.binaries_dir(),
            self.appdata.join("webview2"),
            self.suite_programs_dir(),
        ];

        directories.extend(Vendor::ALL.iter().map(|vendor| self.vendor_dir(*vendor)));
        directories.extend(StorageKind::ALL.iter().map(|kind| self.storage(*kind)));

        for directory in directories {
            std::fs::create_dir_all(&directory).map_err(|error| PathsError::CreateFailed {
                path: directory,
                reason: error.to_string(),
            })?;
        }

        Ok(())
    }
}

/// Resolves `.` and `..` lexically, without consulting the filesystem.
///
/// Filesystem canonicalisation is deliberately avoided: it fails on paths that
/// do not exist yet, and on Windows it rewrites drive letters into `\\?\`
/// verbatim form, which then fails to compare against the root.
fn normalise(path: &Utf8Path) -> Utf8PathBuf {
    let mut out = Utf8PathBuf::new();

    for component in path.components() {
        match component {
            Utf8Component::CurDir => {}
            Utf8Component::ParentDir => {
                out.pop();
            }
            other => out.push(other.as_str()),
        }
    }

    out
}
