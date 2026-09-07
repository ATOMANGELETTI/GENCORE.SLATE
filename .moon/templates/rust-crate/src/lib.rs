//! {{ description }}
//!
//! Describe here what this crate owns, what it deliberately does not, and
//! where it sits in the dependency graph. Someone reading this in six months
//! should be able to tell whether their change belongs here.
//!
//! Remember the rules that apply to every crate:
//!
//! - Tests live in `tests/`, so anything worth testing must be public and
//!   documented (ADR 0007).
//! - Paths come from `slate-paths`, never from the operating system.
//! - The folder is the role and the file is the subject: `commands/window.rs`,
//!   not `window.commands.rs`.

pub mod error;

pub use error::{{ '{' }}{{ name | pascal_case }}Error{{ '}' }};
