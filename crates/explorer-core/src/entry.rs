//! The filesystem entry model.

use serde::{Deserialize, Serialize};

/// What kind of thing an entry is.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum EntryKind {
    /// A directory. Sorts before files, as a file manager should.
    Directory,
    /// A regular file.
    File,
    /// A symbolic link or junction.
    ///
    /// Kept distinct rather than resolved: a link can point outside the
    /// portable root, and the Explorer must be able to show that it exists
    /// without following it.
    Link,
}

/// One entry in a directory listing.
///
/// The path is **relative to the portable root**, never absolute. A listing
/// that carried absolute paths would break the moment the install was copied
/// to another drive, and would leak the user's directory layout into the
/// webview for no benefit.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Entry {
    /// The file or directory name.
    pub name: String,
    /// The path relative to the portable root, using forward slashes.
    pub relative_path: String,
    /// What kind of entry it is.
    pub kind: EntryKind,
    /// Size in bytes. Always zero for a directory — computing a recursive size
    /// is a separate, expensive operation and must not hide inside a listing.
    pub size: u64,
    /// Last modification time, as a Unix timestamp in seconds.
    pub modified: Option<i64>,
    /// Whether the entry is hidden by the operating system's convention.
    pub is_hidden: bool,
    /// Whether the entry is read-only.
    pub is_readonly: bool,
}

/// How to order a listing.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum SortBy {
    /// Alphabetical, case-insensitive.
    #[default]
    Name,
    /// Largest or smallest first.
    Size,
    /// Most or least recently changed.
    Modified,
    /// Group by file extension, then by name.
    Kind,
}

/// Ascending or descending.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum SortDirection {
    /// A to Z, smallest first, oldest first.
    #[default]
    Ascending,
    /// The reverse.
    Descending,
}

impl Entry {
    /// The lower-case extension, if the entry has one.
    pub fn extension(&self) -> Option<&str> {
        if self.kind == EntryKind::Directory {
            return None;
        }
        self.name.rsplit_once('.').map(|(_, extension)| extension)
    }

    /// Orders two entries by the given criteria.
    ///
    /// Directories always sort before files regardless of the criteria — the
    /// behaviour every file manager has, and one users notice immediately when
    /// it is missing.
    pub fn compare(
        &self,
        other: &Self,
        by: SortBy,
        direction: SortDirection,
    ) -> std::cmp::Ordering {
        use std::cmp::Ordering;

        let directories_first = match (self.kind, other.kind) {
            (EntryKind::Directory, EntryKind::Directory) => Ordering::Equal,
            (EntryKind::Directory, _) => Ordering::Less,
            (_, EntryKind::Directory) => Ordering::Greater,
            _ => Ordering::Equal,
        };

        if directories_first != Ordering::Equal {
            return directories_first;
        }

        let ordering = match by {
            SortBy::Name => compare_names(&self.name, &other.name),
            SortBy::Size => self.size.cmp(&other.size),
            SortBy::Modified => self.modified.cmp(&other.modified),
            SortBy::Kind => self
                .extension()
                .cmp(&other.extension())
                .then_with(|| compare_names(&self.name, &other.name)),
        };

        match direction {
            SortDirection::Ascending => ordering,
            SortDirection::Descending => ordering.reverse(),
        }
    }
}

/// Compares names the way a person reads them: case-insensitively, falling
/// back to a stable byte comparison so ordering never depends on filesystem
/// enumeration order.
fn compare_names(left: &str, right: &str) -> std::cmp::Ordering {
    left.to_lowercase()
        .cmp(&right.to_lowercase())
        .then_with(|| left.cmp(right))
}
