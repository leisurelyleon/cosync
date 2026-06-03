//! A single client connection: the WebSocket read/write loops and the glue
//! between this socket and its room's broadcast channel.

use axum::extract::ws::{Message, WebSocket};
use futures::{sink::SinkExt, stream::StreamExt};
use uuid::Uuid;

use crate::protocol::{ClientMessage, ServerMessage};
use crate::state::AppState;

/// Handle one WebSocket connection for the given room.
pub async fn handle_socket(socket: WebSocket, room_id: String, state: AppState) {
    let client_id = Uuid::new_v4().to_string();

    // Split into independent sender/receiver halves so reads and writes can
    // run as separate tasks without sharing the socket.
    let (mut sink, mut stream) = socket.split();

    // Wait for the client's `Hello` to learn its display name. We bound this
    // to the first message; anything else and we just drop the connection.
    let name = match stream.next().await {
        Some(Ok(Message::Text(text))) => match serde_json::from_str::<ClientMessage>(&text) {
            Ok(ClientMessage::Hello { name }) => name,
            _ => return,
        },
        _ => return,
    };

    // Register in the room and capture the initial snapshot + a broadcast rx.
    let (welcome, mut rx) = {
        let mut room = state.rooms.entry(room_id.clone()).or_default();
        room.add_participant(client_id.clone(), name);
        let welcome = ServerMessage::Welcome {
            client_id: client_id.clone(),
            content: room.content(),
            participants: room.participants(),
        };
        let rx = room.subscribe();
        (welcome, rx)
    };

    // Send the welcome snapshot directly to this client.
    if sink.send(Message::Text(serialize(&welcome))).await.is_err() {
        cleanup(&state, &room_id, &client_id);
        return;
    }

    // Announce the updated roster to everyone (including us).
    if let Some(room) = state.rooms.get(&room_id) {
        room.broadcast_presence();
    }

    // Forward broadcast messages from the room to this client's socket.
    let mut send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            if sink.send(Message::Text(serialize(&msg))).await.is_err() {
                break;
            }
        }
    });

    // Read messages from this client and apply them to the room.
    let recv_state = state.clone();
    let recv_room = room_id.clone();
    let recv_id = client_id.clone();
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = stream.next().await {
            if let Message::Text(text) = msg {
                if let Ok(ClientMessage::Edit { content }) =
                    serde_json::from_str::<ClientMessage>(&text)
                {
                    if let Some(mut room) = recv_state.rooms.get_mut(&recv_room) {
                        room.apply_edit(content, recv_id.clone());
                    }
                }
            }
        }
    });

    // When either task ends (disconnect or error), abort the other.
    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort(),
    }

    // Deregister and refresh presence for the remaining participants.
    cleanup(&state, &room_id, &client_id);
    if let Some(room) = state.rooms.get(&room_id) {
        room.broadcast_presence();
    }
}

/// Remove a participant; drop the room entirely if it's now empty.
fn cleanup(state: &AppState, room_id: &str, client_id: &str) {
    let empty = state
        .rooms
        .get_mut(room_id)
        .map(|mut room| room.remove_participant(client_id))
        .unwrap_or(false);
    if empty {
        state.rooms.remove(room_id);
    }
}

/// Serialize a server message to JSON text. Server-authored types always
/// serialize cleanly, so a failure here is unreachable in practice.
fn serialize(msg: &ServerMessage) -> String {
    serde_json::to_string(msg).unwrap_or_else(|_| "{}".to_string())
}
