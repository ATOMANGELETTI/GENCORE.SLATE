//! Replace this with tests for real behaviour.
//!
//! Integration tests can only reach the public API, which is deliberate: if
//! something needs testing, it needs to be public and documented (ADR 0007).

use {{ name | snake_case }}::{{ '{' }}{{ name | pascal_case }}Error{{ '}' }};

#[test]
fn errors_convert_into_the_shared_error_type() {
    let error = {{ name | pascal_case }}Error::NotImplemented("example".to_owned());

    let converted: slate_core::SlateError = error.into();

    assert_eq!(converted.kind(), "internal");
}
