//! Failures this crate can produce.

use slate_core::SlateError;

/// Something went wrong.
///
/// Each variant should name what failed and carry the values involved.
/// "invalid input" is not an error message.
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum {{ name | pascal_case }}Error {
    /// Replace with a real variant.
    #[error("not yet implemented: {0}")]
    NotImplemented(String),
}

impl From<{{ name | pascal_case }}Error> for SlateError {
    fn from(error: {{ name | pascal_case }}Error) -> Self {
        Self::Internal(error.to_string())
    }
}
