//! Version constants and the suite version read from the portable root.

use core::fmt;

use serde::{Deserialize, Serialize};

/// The IPC wire protocol version.
///
/// Every broker connection begins with a handshake carrying this number. A
/// client that receives a version it does not understand disconnects and
/// disables cross-application features rather than guessing at the payloads.
///
/// Increment this for any breaking change to the message shapes in
/// `slate-ipc`, and record it in a changeset as a major bump.
pub const PROTOCOL_VERSION: u16 = 1;

/// The version of the portable directory layout.
///
/// Written into `.slate-root` at packaging time. Increment it whenever a
/// directory moves or changes meaning, and add the corresponding migration to
/// `slate-paths` so an older install can be brought forward.
pub const SCHEMA_VERSION: u16 = 1;

/// The version of the suite this binary belongs to.
///
/// Set from the Cargo workspace version, which is itself written by
/// `scripts/bun-version.ts` during a release — see ADR 0009. It is never
/// edited by hand.
pub const SUITE_VERSION: &str = env!("CARGO_PKG_VERSION");

/// A semantic version, as recorded in `.slate-root`.
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub struct SuiteVersion {
    /// Incompatible changes.
    pub major: u16,
    /// Backwards-compatible additions.
    pub minor: u16,
    /// Backwards-compatible fixes.
    pub patch: u16,
}

impl SuiteVersion {
    /// The version compiled into this binary.
    pub fn current() -> Self {
        Self::parse(SUITE_VERSION).unwrap_or(Self {
            major: 0,
            minor: 0,
            patch: 0,
        })
    }

    /// Parses a `major.minor.patch` string, ignoring any pre-release suffix.
    ///
    /// Returns `None` if the string is not three dot-separated numbers.
    pub fn parse(value: &str) -> Option<Self> {
        let core = value.split(['-', '+']).next()?;
        let mut parts = core.split('.');

        let major = parts.next()?.parse().ok()?;
        let minor = parts.next()?.parse().ok()?;
        let patch = parts.next()?.parse().ok()?;

        if parts.next().is_some() {
            return None;
        }

        Some(Self {
            major,
            minor,
            patch,
        })
    }

    /// Whether an install written by `self` can be read by `other`.
    ///
    /// Before 1.0 every minor version is treated as potentially incompatible,
    /// which is the conservative reading and the one a portable install
    /// deserves: refusing to open an unfamiliar layout is far better than
    /// corrupting it.
    pub fn is_compatible_with(&self, other: &Self) -> bool {
        if self.major == 0 || other.major == 0 {
            self.major == other.major && self.minor == other.minor
        } else {
            self.major == other.major
        }
    }
}

impl fmt::Display for SuiteVersion {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}.{}.{}", self.major, self.minor, self.patch)
    }
}
