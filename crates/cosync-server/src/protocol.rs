//! Wire protocol shared between client and server.
//!
//! Messages are JSON, tagged by a `type` field so the TypeScript client can
//! discriminate them (see web/lib/protocol.ts, which mirrors this file).

use serde::{Deserialize, Serialize};

/// Messages sent FROM a client TO the server.
#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ClientMessage {
    /// Client announces its display name on joining.
    Hello { name: String },
    /// Client replaces the full document contents.
    Edit { content: String },
}

/// Messages sent FROM the server TO clients.
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ServerMessage {
    /// Sent once to a newly joined client: their id + current doc + roster.
    Welcome {
        client_id: String,
        content: String,
        participants: Vec<Participant>,
    },
    /// The document changed (broadcast to everyone).
    Doc { content: String, from: String },
    /// The participant roster changed (someone joined or left).
    Presence { participants: Vec<Participant> },
}

/// A connected participant, as seen by other clients.
#[derive(Debug, Clone, Serialize)]
pub struct Participant {
    pub id: String,
    pub name: String,
    pub color: String,
}
