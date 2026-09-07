//! The broker's address.

use camino::Utf8Path;
use sha2::{Digest, Sha256};

/// Prefix for every pipe the suite creates.
const PIPE_PREFIX: &str = r"\\.\pipe\gencore.slate.";

/// How many hex characters of the root hash to use.
///
/// Sixteen gives 64 bits — far more than enough to keep a handful of installs
/// on one machine distinct, while keeping the name readable in a log.
const HASH_LENGTH: usize = 16;

/// The named-pipe address for the broker serving `root`.
///
/// The portable root is hashed into the name so that two installs — one on the
/// internal drive, one on a USB stick — never talk to each other. Applications
/// launched from the same `installDir` share a broker; applications from
/// different roots are invisible to one another, which is exactly the
/// isolation a portable suite needs.
///
/// The path is compared case-insensitively, because Windows treats
/// `D:\Tools\Slate` and `d:\tools\slate` as the same directory and the two
/// spellings must not produce two brokers.
pub fn broker_pipe_name(root: &Utf8Path) -> String {
    format!("{PIPE_PREFIX}{}", root_fingerprint(root))
}

/// The short hex fingerprint of a portable root.
///
/// Also used in log messages, where it identifies which install produced a
/// line without printing the user's full directory path.
pub fn root_fingerprint(root: &Utf8Path) -> String {
    let normalised = root
        .as_str()
        .replace('/', "\\")
        .trim_end_matches('\\')
        .to_lowercase();

    let digest = Sha256::digest(normalised.as_bytes());

    digest
        .iter()
        .take(HASH_LENGTH / 2)
        .fold(String::with_capacity(HASH_LENGTH), |mut out, byte| {
            use std::fmt::Write as _;
            // Writing to a String cannot fail; the result is discarded deliberately.
            let _ = write!(out, "{byte:02x}");
            out
        })
}
