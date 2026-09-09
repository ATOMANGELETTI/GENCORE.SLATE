//! Locating the portable root.
//!
//! See ADR 0004 for why discovery is marker-based rather than counting a fixed
//! number of directories above the executable.

use camino::{Utf8Path, Utf8PathBuf};

use crate::error::PathsError;
use crate::marker::RootMarker;

/// Set by the Launcher for every child process it spawns.
///
/// This is the fast path: one environment read, no filesystem walk, and a
/// guarantee that every application in a session agrees on the same root.
pub const ENV_INSTALL_DIR: &str = "SLATE_INSTALL_DIR";

/// Development-only override, honoured by debug builds.
pub const ENV_DEV_ROOT: &str = "SLATE_DEV_ROOT";

/// The repository checkout root, set by `scripts/bun-dev.ts` alongside
/// [`ENV_DEV_ROOT`], and honoured by debug builds only.
///
/// A development checkout has no packaged executable for the Launcher to
/// start a sibling application with, so it falls back to running that
/// sibling's own `bun run dev:<app>` script instead — which only means
/// something run from here.
pub const ENV_REPO_ROOT: &str = "SLATE_REPO_ROOT";

/// How far up the tree to search before giving up.
///
/// A real install nests an executable five levels below the root. Sixteen
/// leaves generous room for unusual vendor layouts while still terminating
/// promptly on a machine where no root exists.
const MAX_ASCENT: usize = 16;

/// Finds the portable root.
///
/// The order is deliberate:
///
/// 1. `SLATE_INSTALL_DIR`, if set and valid.
/// 2. The nearest ancestor of the running executable containing `.slate-root`.
/// 3. In debug builds only, `SLATE_DEV_ROOT`.
///
/// There is no fallback to an operating-system directory. If none of these
/// succeeds the application fails to start, which is the correct outcome:
/// guessing would mean writing a user's data somewhere they will never find it.
///
/// # Errors
///
/// Returns [`PathsError::RootNotFound`] listing every location tried, or
/// [`PathsError::InvalidRoot`] when an explicit override names a directory
/// that is not a portable root.
pub fn discover_root() -> Result<Utf8PathBuf, PathsError> {
    let mut searched: Vec<String> = Vec::new();

    if let Some(root) = env_path(ENV_INSTALL_DIR) {
        searched.push(format!("{ENV_INSTALL_DIR}={root}"));
        return validate_root(&root).map(|()| root);
    }

    let executable = current_executable()?;
    searched.push(format!("ancestors of {executable}"));

    if let Some(root) = find_marker_upward(&executable) {
        return Ok(root);
    }

    if cfg!(debug_assertions)
        && let Some(root) = env_path(ENV_DEV_ROOT)
    {
        searched.push(format!("{ENV_DEV_ROOT}={root}"));
        if RootMarker::exists_in(&root) {
            return Ok(root);
        }
    }

    Err(PathsError::RootNotFound {
        searched: searched.join("; "),
    })
}

/// The repository checkout root, in a development build started through
/// `scripts/bun-dev.ts`.
///
/// `None` in a release build regardless of what the environment holds — a
/// stray value left over on a machine must never be picked up in production —
/// and `None` in a debug build the script did not start, which means there is
/// no `bun run` workflow to fall back to either. A caller sees exactly one
/// signal either way: whether there is a repository to run `bun run` from.
pub fn dev_repo_root() -> Option<Utf8PathBuf> {
    if cfg!(debug_assertions) {
        env_path(ENV_REPO_ROOT)
    } else {
        None
    }
}

/// Walks upward from `start` looking for a directory containing the marker.
///
/// `start` may be a file or a directory; a file's parent is used.
pub fn find_marker_upward(start: &Utf8Path) -> Option<Utf8PathBuf> {
    let mut current = if start.is_file() {
        start.parent()?
    } else {
        start
    };

    for _ in 0..MAX_ASCENT {
        if RootMarker::exists_in(current) {
            return Some(current.to_owned());
        }
        current = current.parent()?;
    }

    None
}

/// Confirms that `root` exists, is a directory, and carries a readable marker.
///
/// # Errors
///
/// Returns [`PathsError::InvalidRoot`] with the specific reason.
pub fn validate_root(root: &Utf8Path) -> Result<(), PathsError> {
    if !root.exists() {
        return Err(PathsError::InvalidRoot {
            root: root.to_owned(),
            reason: "the directory does not exist".to_owned(),
        });
    }
    if !root.is_dir() {
        return Err(PathsError::InvalidRoot {
            root: root.to_owned(),
            reason: "the path is not a directory".to_owned(),
        });
    }

    RootMarker::load(root).map(|_| ())
}

/// The directory containing the running executable, as UTF-8.
fn current_executable() -> Result<Utf8PathBuf, PathsError> {
    let executable = std::env::current_exe()
        .map_err(|error| PathsError::ExecutableUnknown(error.to_string()))?;

    Utf8PathBuf::from_path_buf(executable)
        .map_err(|path| PathsError::NotUtf8(path.to_string_lossy().into_owned()))
}

/// Reads an environment variable as a path, treating empty as unset.
fn env_path(name: &str) -> Option<Utf8PathBuf> {
    let value = std::env::var(name).ok()?;
    if value.trim().is_empty() {
        return None;
    }
    Some(Utf8PathBuf::from(value))
}
