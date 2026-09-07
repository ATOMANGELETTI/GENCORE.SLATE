//! Directory listing, ordering, and the storage boundary.

// Test-support helpers outside a #[test] function are not covered by
// clippy.toml's allow-expect-in-tests, but the reasoning is the same: a
// fixture that cannot be built should fail loudly here and now.
#![allow(clippy::expect_used)]

use explorer_core::{
    EntryKind, ListingError, ListingOptions, SortBy, SortDirection, list_directory,
};
use slate_paths::SlatePaths;
use slate_testing::PortableRoot;

fn fixture() -> (PortableRoot, SlatePaths) {
    let root = PortableRoot::new();
    let paths = SlatePaths::from_root(root.path()).expect("the fixture is a valid portable root");
    (root, paths)
}

#[test]
fn lists_files_and_directories() {
    let (root, paths) = fixture();
    root.write_file("storage/documents/notes.md", "hello");
    root.write_file("storage/documents/letters/draft.md", "hello");

    let entries = list_directory(&paths, "documents", ListingOptions::default())
        .expect("the listing succeeds");

    assert_eq!(entries.len(), 2);
    assert!(entries.iter().any(|entry| entry.name == "notes.md"));
    assert!(entries.iter().any(|entry| entry.name == "letters"));
}

#[test]
fn directories_sort_before_files_whatever_the_criteria() {
    let (root, paths) = fixture();
    root.write_file("storage/documents/a-file.txt", "x");
    root.write_file("storage/documents/z-folder/inner.txt", "x");

    for sort_by in [SortBy::Name, SortBy::Size, SortBy::Modified, SortBy::Kind] {
        let entries = list_directory(
            &paths,
            "documents",
            ListingOptions {
                sort_by,
                ..ListingOptions::default()
            },
        )
        .expect("the listing succeeds");

        assert_eq!(
            entries[0].kind,
            EntryKind::Directory,
            "directories must come first when sorting by {sort_by:?}",
        );
    }
}

#[test]
fn sorts_by_name_case_insensitively() {
    let (root, paths) = fixture();
    for name in ["Banana.txt", "apple.txt", "Cherry.txt"] {
        root.write_file(&format!("storage/documents/{name}"), "x");
    }

    let entries = list_directory(&paths, "documents", ListingOptions::default())
        .expect("the listing succeeds");

    let names: Vec<&str> = entries.iter().map(|entry| entry.name.as_str()).collect();
    assert_eq!(names, ["apple.txt", "Banana.txt", "Cherry.txt"]);
}

#[test]
fn reverses_the_order_on_request() {
    let (root, paths) = fixture();
    for name in ["a.txt", "b.txt", "c.txt"] {
        root.write_file(&format!("storage/documents/{name}"), "x");
    }

    let entries = list_directory(
        &paths,
        "documents",
        ListingOptions {
            direction: SortDirection::Descending,
            ..ListingOptions::default()
        },
    )
    .expect("the listing succeeds");

    let names: Vec<&str> = entries.iter().map(|entry| entry.name.as_str()).collect();
    assert_eq!(names, ["c.txt", "b.txt", "a.txt"]);
}

#[test]
fn hides_dot_files_unless_asked() {
    let (root, paths) = fixture();
    root.write_file("storage/documents/.hidden", "x");
    root.write_file("storage/documents/visible.txt", "x");

    let hidden = list_directory(&paths, "documents", ListingOptions::default())
        .expect("the listing succeeds");
    assert_eq!(hidden.len(), 1);

    let shown = list_directory(
        &paths,
        "documents",
        ListingOptions {
            show_hidden: true,
            ..ListingOptions::default()
        },
    )
    .expect("the listing succeeds");
    assert_eq!(shown.len(), 2);
}

#[test]
fn reports_sizes_for_files_and_zero_for_directories() {
    let (root, paths) = fixture();
    root.write_file("storage/documents/five.txt", "12345");
    root.write_file("storage/documents/folder/inner.txt", "x");

    let entries = list_directory(&paths, "documents", ListingOptions::default())
        .expect("the listing succeeds");

    let file = entries
        .iter()
        .find(|entry| entry.name == "five.txt")
        .expect("present");
    let directory = entries
        .iter()
        .find(|entry| entry.name == "folder")
        .expect("present");

    assert_eq!(file.size, 5);
    assert_eq!(
        directory.size, 0,
        "a recursive size must not hide inside a listing"
    );
}

#[test]
fn paths_are_relative_to_the_portable_root() {
    // An absolute path would break the moment the install is copied to another
    // drive, and would leak the user's directory layout into the webview.
    let (root, paths) = fixture();
    root.write_file("storage/documents/notes.md", "x");

    let entries = list_directory(&paths, "documents", ListingOptions::default())
        .expect("the listing succeeds");

    assert_eq!(entries[0].relative_path, "storage/documents/notes.md");
    assert!(
        !entries[0].relative_path.contains(':'),
        "no drive letter may appear"
    );
}

#[test]
fn refuses_to_escape_the_storage_tree() {
    let (_root, paths) = fixture();

    let error = list_directory(&paths, "../../Windows", ListingOptions::default())
        .expect_err("traversal out of storage must be refused");

    assert!(matches!(error, ListingError::Paths(_)), "got {error:?}");
}

#[test]
fn refuses_an_absolute_path() {
    let (_root, paths) = fixture();

    let error = list_directory(&paths, "C:/Windows/System32", ListingOptions::default())
        .expect_err("an absolute path must be refused");

    assert!(matches!(error, ListingError::Paths(_)), "got {error:?}");
}

#[test]
fn reports_a_missing_directory_distinctly_from_a_file() {
    let (root, paths) = fixture();
    root.write_file("storage/documents/notes.md", "x");

    let missing = list_directory(&paths, "documents/nowhere", ListingOptions::default())
        .expect_err("missing");
    assert!(
        matches!(missing, ListingError::NotFound { .. }),
        "got {missing:?}"
    );

    let file = list_directory(&paths, "documents/notes.md", ListingOptions::default())
        .expect_err("a file");
    assert!(
        matches!(file, ListingError::NotADirectory { .. }),
        "got {file:?}"
    );
}

#[test]
fn an_empty_directory_lists_as_empty_rather_than_failing() {
    let (_root, paths) = fixture();

    let entries = list_directory(&paths, "downloads", ListingOptions::default())
        .expect("the listing succeeds");

    assert!(entries.is_empty());
}
