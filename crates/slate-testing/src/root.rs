//! A temporary portable root that mirrors the shipped layout.

use camino::{Utf8Path, Utf8PathBuf};
use tempfile::TempDir;

/// The marker file that identifies a portable root.
pub const MARKER_FILE: &str = ".slate-root";

/// Directories created by [`PortableRoot::new`], relative to the root.
const LAYOUT: &[&str] = &[
    "appdata/binaries/webview2",
    "appdata/config",
    "appdata/database",
    "appdata/logs",
    "appdata/resources",
    "appdata/webview2",
    "programs/gencore/slate",
    "programs/portableapps.com",
    "programs/portapps.io",
    "storage/desktop",
    "storage/documents",
    "storage/downloads",
    "storage/music",
    "storage/pictures",
    "storage/videos",
];

/// A disposable portable root for tests.
///
/// The directory is deleted when the value is dropped, so hold it for as long
/// as the test needs the files — binding it to `_` drops it immediately and
/// produces confusing failures.
#[derive(Debug)]
pub struct PortableRoot {
    // Kept solely to own the directory's lifetime.
    _temp: TempDir,
    root: Utf8PathBuf,
}

impl PortableRoot {
    /// Creates a complete portable root, including the `.slate-root` marker.
    ///
    /// # Panics
    ///
    /// Panics if the temporary directory cannot be created or is not valid
    /// UTF-8. Both indicate a broken test environment rather than a condition
    /// a test could handle.
    #[must_use]
    pub fn new() -> Self {
        Self::build(true)
    }

    /// Creates the directory tree but omits the `.slate-root` marker.
    ///
    /// Used to test that discovery fails cleanly rather than guessing.
    ///
    /// # Panics
    ///
    /// See [`PortableRoot::new`].
    #[must_use]
    pub fn without_marker() -> Self {
        Self::build(false)
    }

    fn build(with_marker: bool) -> Self {
        let temp = TempDir::new().expect("failed to create a temporary directory");
        let root = Utf8PathBuf::from_path_buf(temp.path().to_path_buf())
            .expect("temporary directory path is not valid UTF-8");

        for directory in LAYOUT {
            std::fs::create_dir_all(root.join(directory)).expect("failed to create fixture layout");
        }

        if with_marker {
            let marker = concat!(
                "[suite]\n",
                "version = \"0.1.0\"\n",
                "build_id = \"test\"\n",
                "schema_version = 1\n",
                "\n",
                "[layout]\n",
                "appdata = \"appdata\"\n",
                "programs = \"programs\"\n",
                "storage = \"storage\"\n",
            );
            std::fs::write(root.join(MARKER_FILE), marker)
                .expect("failed to write the root marker");
        }

        Self { _temp: temp, root }
    }

    /// The absolute path of the portable root.
    #[must_use]
    pub fn path(&self) -> &Utf8Path {
        &self.root
    }

    /// Creates a placeholder executable at the depth a real application sits,
    /// and returns its path.
    ///
    /// Discovery walks upward from an executable, so tests need one nested as
    /// deeply as the shipped layout puts it.
    ///
    /// # Panics
    ///
    /// Panics if the file cannot be written.
    pub fn install_app(&self, app_id: &str) -> Utf8PathBuf {
        let directory = self.root.join("programs/gencore/slate").join(app_id);
        std::fs::create_dir_all(&directory).expect("failed to create the application directory");

        let executable = directory.join(format!("{app_id}.exe"));
        std::fs::write(&executable, b"placeholder")
            .expect("failed to write the placeholder executable");
        executable
    }

    /// Writes a configuration file into `appdata/config/`.
    ///
    /// # Panics
    ///
    /// Panics if the file cannot be written.
    pub fn write_config(&self, file_name: &str, contents: &str) -> Utf8PathBuf {
        let path = self.root.join("appdata/config").join(file_name);
        std::fs::write(&path, contents).expect("failed to write the configuration file");
        path
    }

    /// Writes a file at a path relative to the root, creating parents.
    ///
    /// # Panics
    ///
    /// Panics if the file cannot be written.
    pub fn write_file(&self, relative: &str, contents: &str) -> Utf8PathBuf {
        let path = self.root.join(relative);
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).expect("failed to create the parent directory");
        }
        std::fs::write(&path, contents).expect("failed to write the file");
        path
    }
}

impl Default for PortableRoot {
    fn default() -> Self {
        Self::new()
    }
}
