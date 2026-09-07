//! Failures that can occur while resolving portable paths.

use camino::Utf8PathBuf;
use slate_core::SlateError;

/// Something went wrong locating or resolving a path inside the portable root.
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum PathsError {
    /// No `.slate-root` marker was found, and no override was set.
    ///
    /// The message lists every location that was searched, because the useful
    /// question when this happens is always "where did it look?".
    #[error("portable root not found; searched: {searched}")]
    RootNotFound {
        /// The candidate locations, in the order they were tried.
        searched: String,
    },

    /// A root was named explicitly but does not exist or has no marker file.
    #[error("{root} is not a portable root ({reason})")]
    InvalidRoot {
        /// The path that was tried.
        root: Utf8PathBuf,
        /// Why it was rejected.
        reason: String,
    },

    /// The `.slate-root` marker exists but could not be parsed.
    #[error("malformed root marker at {path}: {reason}")]
    MalformedMarker {
        /// The marker file.
        path: Utf8PathBuf,
        /// The parse failure.
        reason: String,
    },

    /// The install was written by a layout version this binary cannot read.
    #[error("install layout schema {found} is not supported (this build expects {expected})")]
    UnsupportedSchema {
        /// The version recorded in the marker.
        found: u16,
        /// The version this binary understands.
        expected: u16,
    },

    /// A path would resolve outside the portable root.
    ///
    /// This is the guard that keeps the portability promise, and it is a hard
    /// error rather than a clamp: silently rewriting a path to something the
    /// caller did not ask for hides the bug instead of surfacing it.
    #[error("{path} escapes the portable root {root}")]
    EscapesRoot {
        /// The offending path.
        path: Utf8PathBuf,
        /// The root it escaped.
        root: Utf8PathBuf,
    },

    /// The running executable's location could not be determined.
    #[error("could not determine the current executable: {0}")]
    ExecutableUnknown(String),

    /// A directory in the layout could not be created.
    #[error("could not create {path}: {reason}")]
    CreateFailed {
        /// The directory that could not be created.
        path: Utf8PathBuf,
        /// The underlying failure.
        reason: String,
    },

    /// A path was supplied that is not valid UTF-8.
    ///
    /// The suite works in UTF-8 throughout via `camino`. A Windows path that
    /// is not representable is rejected at the boundary rather than being
    /// lossily converted.
    #[error("path is not valid UTF-8: {0}")]
    NotUtf8(String),
}

impl From<PathsError> for SlateError {
    fn from(error: PathsError) -> Self {
        Self::Paths(error.to_string())
    }
}
