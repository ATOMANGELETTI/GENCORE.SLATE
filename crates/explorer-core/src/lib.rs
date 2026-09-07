//! Filesystem model for the Explorer.
//!
//! Everything here is scoped to the portable `storage/` tree. The Explorer
//! cannot show `C:\Users`, and that is deliberate rather than a limitation: a
//! portable suite that browses the host machine is a portable suite that will
//! eventually write to it.
//!
//! The Tauri capability enforces the same boundary independently (see
//! `.agents/rules/08-tauri-and-security.md`). Two layers, because a path check
//! that exists only in one place is a path check waiting to be bypassed.

pub mod entry;
pub mod listing;

pub use entry::{Entry, EntryKind, SortBy, SortDirection};
pub use listing::{ListingError, ListingOptions, list_directory};
