//! Per-room state: the shared document, the participant roster, and the
//! broadcast channel used to fan edits out to every connected session.

use std::collections::HashMap;

use tokio::sync::broadcast;

use crate::protocol::{Participant, ServerMessage};

/// How many messages a slow client may lag before being dropped from the
/// broadcast. Generous enough for a text editor's traffic.
const BROADCAST_CAPACITY: usize = 256;

/// A palette assigned round-robin to participants for their presence color.
const PALETTE: &[&str] = &[
    "#58a6ff", "#3fb950", "#d29922", "#f85149", "#bc8cff", "#39c5cf",
];

pub struct Room {
    /// Canonical document contents. The server is authoritative (ADR 0001).
    content: String,
    /// Connected participants, keyed by client id.
    participants: HashMap<String, Participant>,
    /// Broadcast sender; each session subscribes a receiver.
    tx: broadcast::Sender<ServerMessage>,
    /// Rotating index into PALETTE for the next color.
    next_color: usize,
}

impl Room {
    pub fn new() -> Self {
        let (tx, _rx) = broadcast::channel(BROADCAST_CAPACITY);
        Self {
            content: String::new(),
            participants: HashMap::new(),
            tx,
            next_color: 0,
        }
    }

    /// Subscribe a new receiver to this room's broadcast stream.
    pub fn subscribe(&self) -> broadcast::Receiver<ServerMessage> {
        self.tx.subscribe()
    }

    /// Current document contents.
    pub fn content(&self) -> String {
        self.content.clone()
    }

    /// Snapshot of the current participant roster.
    pub fn participants(&self) -> Vec<Participant> {
        self.participants.values().cloned().collect()
    }

    /// Register a participant; returns the assigned `Participant`.
    pub fn add_participant(&mut self, id: String, name: String) -> Participant {
        let color = PALETTE[self.next_color % PALETTE.len()].to_string();
        self.next_color = self.next_color.wrapping_add(1);
        let p = Participant {
            id: id.clone(),
            name,
            color,
        };
        self.participants.insert(id, p.clone());
        p
    }

    /// Remove a participant (on disconnect). Returns true if the room is now empty.
    pub fn remove_participant(&mut self, id: &str) -> bool {
        self.participants.remove(id);
        self.participants.is_empty()
    }

    /// Apply an edit to the canonical document and broadcast it.
    pub fn apply_edit(&mut self, content: String, from: String) {
        self.content = content.clone();
        // A send error just means no receivers are currently listening; ignore.
        let _ = self.tx.send(ServerMessage::Doc { content, from });
    }

    /// Broadcast the current roster to everyone.
    pub fn broadcast_presence(&self) {
        let _ = self.tx.send(ServerMessage::Presence {
            participants: self.participants(),
        });
    }
}

impl Default for Room {
    fn default() -> Self {
        Self::new()
    }
}
