//! The wire protocol: framing, encoding, and addressing.

use std::io::Cursor;

use camino::Utf8Path;
use slate_core::{AppId, KnownApp, PROTOCOL_VERSION};
use slate_ipc::{
    Event, IpcError, MAX_FRAME_BYTES, Request, Response, broker_pipe_name, read_frame,
    root_fingerprint, write_frame,
};

fn app() -> AppId {
    KnownApp::Terminal.id()
}

#[test]
fn a_request_survives_a_frame_round_trip() {
    let original = Request::Hello {
        app: app(),
        pid: 4_242,
        protocol: PROTOCOL_VERSION,
    };

    let mut buffer = Vec::new();
    write_frame(&mut buffer, &original).expect("encodes");
    let decoded: Request = read_frame(&mut Cursor::new(buffer)).expect("decodes");

    assert_eq!(decoded, original);
}

#[test]
fn several_frames_read_back_in_order() {
    let messages = [
        Request::Ping,
        Request::Subscribe {
            topic: "slate/config".to_owned(),
        },
        Request::ListApps,
    ];

    let mut buffer = Vec::new();
    for message in &messages {
        write_frame(&mut buffer, message).expect("encodes");
    }

    let mut cursor = Cursor::new(buffer);
    for expected in &messages {
        let decoded: Request = read_frame(&mut cursor).expect("decodes");
        assert_eq!(&decoded, expected);
    }
}

#[test]
fn a_clean_close_reports_disconnected_rather_than_a_transport_error() {
    let mut empty = Cursor::new(Vec::new());

    let error = read_frame::<_, Request>(&mut empty).expect_err("nothing to read");

    assert!(matches!(error, IpcError::Disconnected), "got {error:?}");
    assert!(
        error.is_broker_absent(),
        "a clean close means the broker went away"
    );
}

#[test]
fn a_truncated_payload_reports_disconnected() {
    // A four-byte prefix claiming 64 bytes, followed by only two.
    let mut buffer = 64_u32.to_le_bytes().to_vec();
    buffer.extend_from_slice(b"ab");

    let error = read_frame::<_, Request>(&mut Cursor::new(buffer)).expect_err("truncated");

    assert!(matches!(error, IpcError::Disconnected), "got {error:?}");
}

#[test]
fn an_oversized_length_prefix_is_refused_before_allocating() {
    // The defence that matters most in a length-prefixed protocol: a hostile
    // prefix must not make the reader allocate what it claims.
    let buffer = u32::MAX.to_le_bytes().to_vec();

    let error = read_frame::<_, Request>(&mut Cursor::new(buffer)).expect_err("too large");

    match error {
        IpcError::FrameTooLarge { size, limit } => {
            assert_eq!(limit, MAX_FRAME_BYTES);
            assert!(size > limit);
        }
        other => panic!("expected FrameTooLarge, got {other:?}"),
    }
}

#[test]
fn a_corrupt_payload_reports_a_decode_failure() {
    let payload = b"{not json";
    let length = u32::try_from(payload.len()).expect("the fixture is small");
    let mut buffer = length.to_le_bytes().to_vec();
    buffer.extend_from_slice(payload);

    let error = read_frame::<_, Request>(&mut Cursor::new(buffer)).expect_err("not decodable");

    assert!(matches!(error, IpcError::Decode(_)), "got {error:?}");
}

#[test]
fn responses_and_events_share_one_encoding() {
    let event = Response::Event {
        topic: "slate/navigation".to_owned(),
        event: Event::OpenPath {
            target: app(),
            path: "storage/documents".to_owned(),
        },
    };

    let mut buffer = Vec::new();
    write_frame(&mut buffer, &event).expect("encodes");
    let decoded: Response = read_frame(&mut Cursor::new(buffer)).expect("decodes");

    assert_eq!(decoded, event);
}

#[test]
fn message_json_is_tagged_so_the_typescript_side_can_discriminate() {
    let json = serde_json::to_string(&Request::Ping).expect("encodes");

    assert!(
        json.contains("\"type\":\"ping\""),
        "unexpected shape: {json}"
    );
}

#[test]
fn two_portable_roots_get_different_pipes() {
    let one = broker_pipe_name(Utf8Path::new("C:/Tools/Slate"));
    let other = broker_pipe_name(Utf8Path::new("E:/Portable/Slate"));

    assert_ne!(
        one, other,
        "installs on different drives must not share a broker"
    );
}

#[test]
fn the_pipe_name_ignores_windows_path_spelling() {
    // Windows treats these as the same directory, so they must produce one
    // broker rather than two that cannot see each other.
    let variants = [
        "D:/Tools/Slate",
        "D:\\Tools\\Slate",
        "d:\\tools\\slate",
        "D:\\Tools\\Slate\\",
    ];

    let names: Vec<String> = variants
        .iter()
        .map(|p| broker_pipe_name(Utf8Path::new(p)))
        .collect();

    assert!(
        names.windows(2).all(|pair| pair[0] == pair[1]),
        "path spellings produced different pipes: {names:?}"
    );
}

#[test]
fn the_pipe_name_is_a_valid_windows_pipe_path() {
    let name = broker_pipe_name(Utf8Path::new("D:/Tools/Slate"));

    assert!(
        name.starts_with(r"\\.\pipe\"),
        "unexpected pipe name: {name}"
    );
    assert!(
        !name[9..].contains('\\'),
        "the pipe name must not contain a separator: {name}"
    );
}

#[test]
fn the_root_fingerprint_is_short_stable_and_hex() {
    let fingerprint = root_fingerprint(Utf8Path::new("D:/Tools/Slate"));

    assert_eq!(fingerprint.len(), 16);
    assert!(fingerprint.chars().all(|c| c.is_ascii_hexdigit()));
    assert_eq!(
        fingerprint,
        root_fingerprint(Utf8Path::new("D:/Tools/Slate"))
    );
}
