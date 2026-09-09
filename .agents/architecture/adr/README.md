# Architecture Decision Records

Each ADR records one decision: what was chosen, what was rejected, and why.
They exist so that a future contributor — human or agent — can tell the
difference between a deliberate constraint and an accident.

**Do not reverse a decision recorded here without writing a new ADR that
supersedes it.** Silently changing a choice made for stated reasons is how a
codebase loses its shape.

| ADR                                        | Decision                                              | Status   |
| ------------------------------------------ | ----------------------------------------------------- | -------- |
| [0001](0001-bun-only-toolchain.md)         | Bun is the only JavaScript runtime and package manager | Accepted |
| [0002](0002-moon-orchestration.md)         | Moon orchestrates; Cargo owns the crate graph          | Accepted |
| [0003](0003-broker-in-launcher.md)         | Separate binaries; the broker is hosted in the Launcher | Accepted |
| [0004](0004-portable-root-discovery.md)    | Portable root discovered via a `.slate-root` marker    | Accepted |
| [0005](0005-bundled-webview2.md)           | Bundle the fixed-version WebView2 runtime              | Accepted |
| [0006](0006-sqlite-rusqlite.md)            | SQLite through rusqlite with the bundled feature       | Accepted |
| [0007](0007-tests-in-tests-directories.md) | All tests live in `tests/`, including Rust             | Accepted |
| [0008](0008-hand-authored-bindings.md)     | Hand-authored IPC bindings instead of tauri-specta     | Accepted |
| [0009](0009-single-suite-version.md)       | One version for the whole suite, driven by Changesets  | Accepted |
| [0010](0010-macos-inspired-chrome.md)      | macOS-inspired chrome with traffic lights on the left  | Accepted |
| [0011](0011-nord-palette.md)               | Nord is the suite's palette                            | Accepted |
| [0012](0012-tray-menu-as-a-window.md)      | The tray menu is a webview window, not a native menu   | Accepted |
| [0013](0013-terminess-ui-typeface.md)      | Terminess is the interface typeface, not just the code one | Accepted |

## Writing a new one

Copy `.agents/templates/adr.template.md`, take the next number, and keep it
short. An ADR that takes ten minutes to read will not be read.
