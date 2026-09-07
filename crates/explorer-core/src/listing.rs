//! Reading a directory, scoped to the portable root.

use camino::Utf8Path;
use serde::{Deserialize, Serialize};
use slate_core::SlateError;
use slate_paths::{PathsError, SlatePaths, StorageKind};

use crate::entry::{Entry, EntryKind, SortBy, SortDirection};

/// Something went wrong listing a directory.
#[derive(Debug, thiserror::Error)]
pub enum ListingError {
    /// The requested path is outside the portable root.
    ///
    /// The first line of defence, ahead of the Tauri capability scope. Both
    /// exist because a boundary enforced in only one place is a boundary that
    /// will eventually be bypassed.
    #[error(transparent)]
    Paths(#[from] PathsError),

    /// The directory does not exist.
    #[error("{path} does not exist")]
    NotFound {
        /// The path, relative to the portable root.
        path: String,
    },

    /// The path exists but is not a directory.
    #[error("{path} is not a directory")]
    NotADirectory {
        /// The path, relative to the portable root.
        path: String,
    },

    /// The directory could not be read.
    #[error("could not read {path}: {reason}")]
    Unreadable {
        /// The path, relative to the portable root.
        path: String,
        /// The underlying failure.
        reason: String,
    },
}

impl From<ListingError> for SlateError {
    fn from(error: ListingError) -> Self {
        match error {
            ListingError::Paths(inner) => Self::from(inner),
            ListingError::NotFound { .. } => Self::NotFound(error.to_string()),
            other => Self::Internal(other.to_string()),
        }
    }
}

/// How to read and order a directory.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct ListingOptions {
    /// Include entries the operating system marks hidden.
    pub show_hidden: bool,
    /// Ordering criteria.
    pub sort_by: SortBy,
    /// Ordering direction.
    pub direction: SortDirection,
}

/// Lists a directory inside the portable `storage/` tree.
///
/// `relative` is interpreted against the storage root, and any attempt to
/// escape it — `..`, an absolute path, a drive letter — is refused rather than
/// clamped.
///
/// # Errors
///
/// Returns [`ListingError::Paths`] for an escape attempt,
/// [`ListingError::NotFound`] or [`ListingError::NotADirectory`] when the path
/// is wrong, and [`ListingError::Unreadable`] when the filesystem refuses.
pub fn list_directory(
    paths: &SlatePaths,
    relative: &str,
    options: ListingOptions,
) -> Result<Vec<Entry>, ListingError> {
    let storage_root = paths.storage_dir().to_owned();
    let target = paths.resolve_within(&storage_root, relative)?;

    if !target.exists() {
        return Err(ListingError::NotFound {
            path: relative.to_owned(),
        });
    }
    if !target.is_dir() {
        return Err(ListingError::NotADirectory {
            path: relative.to_owned(),
        });
    }

    let reader = std::fs::read_dir(&target).map_err(|error| ListingError::Unreadable {
        path: relative.to_owned(),
        reason: error.to_string(),
    })?;

    let mut entries = Vec::new();

    for item in reader {
        let item = match item {
            Ok(item) => item,
            Err(error) => {
                // One unreadable item must not fail the whole listing.
                tracing::debug!(directory = %target, %error, "skipping an unreadable entry");
                continue;
            }
        };

        let Some(entry) = describe(paths, &item) else {
            continue;
        };

        if entry.is_hidden && !options.show_hidden {
            continue;
        }

        entries.push(entry);
    }

    entries.sort_by(|left, right| left.compare(right, options.sort_by, options.direction));

    Ok(entries)
}

/// The user's storage directories, for the Explorer's sidebar.
pub fn storage_roots() -> Vec<(StorageKind, String)> {
    StorageKind::ALL
        .iter()
        .map(|kind| (*kind, kind.display_name().to_owned()))
        .collect()
}

/// Builds an [`Entry`] from a directory item, or `None` if it cannot be read.
fn describe(paths: &SlatePaths, item: &std::fs::DirEntry) -> Option<Entry> {
    let name = item.file_name().to_string_lossy().into_owned();
    let metadata = item.metadata().ok()?;

    let kind = if metadata.is_dir() {
        EntryKind::Directory
    } else if metadata.is_symlink() {
        EntryKind::Link
    } else {
        EntryKind::File
    };

    let absolute = Utf8Path::from_path(&item.path())?.to_owned();
    let relative_path = absolute
        .strip_prefix(paths.root())
        .ok()?
        .as_str()
        .replace('\\', "/");

    let modified = metadata
        .modified()
        .ok()
        .and_then(|time| time.duration_since(std::time::UNIX_EPOCH).ok())
        .and_then(|duration| i64::try_from(duration.as_secs()).ok());

    Some(Entry {
        is_hidden: is_hidden(&name, &metadata),
        is_readonly: metadata.permissions().readonly(),
        size: if kind == EntryKind::Directory {
            0
        } else {
            metadata.len()
        },
        name,
        relative_path,
        kind,
        modified,
    })
}

/// Whether an entry should be treated as hidden.
///
/// Checks the Windows hidden attribute and, as a fallback, the leading-dot
/// convention — which matters because a portable drive is routinely shared
/// with machines that use it.
fn is_hidden(name: &str, metadata: &std::fs::Metadata) -> bool {
    if name.starts_with('.') {
        return true;
    }

    #[cfg(windows)]
    {
        use std::os::windows::fs::MetadataExt;
        const FILE_ATTRIBUTE_HIDDEN: u32 = 0x2;
        const FILE_ATTRIBUTE_SYSTEM: u32 = 0x4;

        metadata.file_attributes() & (FILE_ATTRIBUTE_HIDDEN | FILE_ATTRIBUTE_SYSTEM) != 0
    }

    #[cfg(not(windows))]
    {
        let _ = metadata;
        false
    }
}
