//! The {{ title }} executable. All behaviour lives in the library crate.
// No console window in any build, debug or release. Console visibility is a
// runtime choice, not a compile-time one — set SLATE_LOG_CONSOLE=1 and the
// shared runtime attaches one at startup (see slate_runtime::bootstrap).
#![windows_subsystem = "windows"]

fn main() {
    {{ id | snake_case }}_lib::run();
}
