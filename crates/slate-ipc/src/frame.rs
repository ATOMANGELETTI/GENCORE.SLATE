//! Message framing.
//!
//! A four-byte little-endian length prefix followed by JSON.
//!
//! JSON is chosen over a compact binary encoding deliberately: the traffic is
//! a handful of small messages, and being able to read the wire in a log while
//! debugging a cross-process problem is worth far more than the bytes saved.

use std::io::{Read, Write};

use serde::Serialize;
use serde::de::DeserializeOwned;

use crate::error::IpcError;

/// The largest frame the protocol accepts.
///
/// The real messages are a few hundred bytes. This limit exists so that a
/// corrupt or hostile length prefix cannot make the reader allocate
/// arbitrarily — the first thing a length-prefixed protocol must defend
/// against.
pub const MAX_FRAME_BYTES: usize = 1 << 20; // 1 MiB

/// Serialises `message` and writes it as one frame.
///
/// # Errors
///
/// Returns [`IpcError::Encode`] if the value cannot be serialised,
/// [`IpcError::FrameTooLarge`] if it exceeds [`MAX_FRAME_BYTES`], or
/// [`IpcError::Transport`] if the write fails.
pub fn write_frame<W: Write, T: Serialize>(writer: &mut W, message: &T) -> Result<(), IpcError> {
    let payload =
        serde_json::to_vec(message).map_err(|error| IpcError::Encode(error.to_string()))?;

    if payload.len() > MAX_FRAME_BYTES {
        return Err(IpcError::FrameTooLarge {
            size: payload.len(),
            limit: MAX_FRAME_BYTES,
        });
    }

    let length = u32::try_from(payload.len()).map_err(|_| IpcError::FrameTooLarge {
        size: payload.len(),
        limit: MAX_FRAME_BYTES,
    })?;

    writer
        .write_all(&length.to_le_bytes())
        .map_err(|error| IpcError::Transport(error.to_string()))?;
    writer
        .write_all(&payload)
        .map_err(|error| IpcError::Transport(error.to_string()))?;
    writer
        .flush()
        .map_err(|error| IpcError::Transport(error.to_string()))?;

    Ok(())
}

/// Reads one frame and deserialises it.
///
/// # Errors
///
/// Returns [`IpcError::Disconnected`] when the peer closed cleanly,
/// [`IpcError::FrameTooLarge`] if the prefix exceeds [`MAX_FRAME_BYTES`],
/// [`IpcError::Decode`] if the payload is not valid, or
/// [`IpcError::Transport`] if the read fails.
pub fn read_frame<R: Read, T: DeserializeOwned>(reader: &mut R) -> Result<T, IpcError> {
    let mut length_bytes = [0_u8; 4];

    match reader.read_exact(&mut length_bytes) {
        Ok(()) => {}
        Err(error) if error.kind() == std::io::ErrorKind::UnexpectedEof => {
            return Err(IpcError::Disconnected);
        }
        Err(error) => return Err(IpcError::Transport(error.to_string())),
    }

    let length = u32::from_le_bytes(length_bytes) as usize;
    if length > MAX_FRAME_BYTES {
        return Err(IpcError::FrameTooLarge {
            size: length,
            limit: MAX_FRAME_BYTES,
        });
    }

    let mut payload = vec![0_u8; length];
    reader.read_exact(&mut payload).map_err(|error| {
        if error.kind() == std::io::ErrorKind::UnexpectedEof {
            IpcError::Disconnected
        } else {
            IpcError::Transport(error.to_string())
        }
    })?;

    serde_json::from_slice(&payload).map_err(|error| IpcError::Decode(error.to_string()))
}
