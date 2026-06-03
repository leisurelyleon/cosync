//! cosync — a real-time collaborative editing server.
//!
//! Clients connect over WebSocket to `/ws/:room`. The server holds the
//! authoritative document for each room and broadcasts ordered edits to every
//! participant, along with presence updates.

mod protocol;
mod room;
mod session;
mod state;

use std::net::SocketAddr;

use axum::{
    extract::{
        ws::WebSocketUpgrade,
        Path, State,
    },
    response::IntoResponse,
    routing::get,
    Router,
};
use tower_http::cors::CorsLayer;

use crate::state::AppState;

async fn health() -> &'static str {
    "ok"
}

/// Upgrade an HTTP request to a WebSocket bound to `:room`.
async fn ws_handler(
    ws: WebSocketUpgrade,
    Path(room): Path<String>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| session::handle_socket(socket, room, state))
}

#[tokio::main]
async fn main() {
    let state = AppState::new();

    let app = Router::new()
        .route("/health", get(health))
        .route("/ws/:room", get(ws_handler))
        // The browser connects to the WS endpoint directly (ADR 0002), so
        // permissive CORS is fine; tighten to the Vercel origin in production.
        .layer(CorsLayer::permissive())
        .with_state(state);

    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8080);
    let addr = SocketAddr::from(([0, 0, 0, 0], port));

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    println!("cosync-server listening on http://{addr}");
    axum::serve(listener, app).await.unwrap();
}
