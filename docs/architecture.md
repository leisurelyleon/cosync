# Architecture

`cosync` is a real-time collaborative editor. Multiple users join a room, edit a
shared document, and see each other's changes live along with presence (who's
connected). The server is authoritative — it holds the canonical document and
broadcasts ordered updates.

## Pipeline

```text
browser tab A ─┐          ┌─▶ broadcast ─▶ tab A
├─▶ WebSocket /ws/:room ─▶ Room ─▶ broadcast ─▶ tab B
browser tab B ─┘ (axum + tokio)  └─▶ broadcast ─▶ tab C
```

1. **Connect** — the client opens a WebSocket to `/ws/:room` and sends a `hello`
   with its display name.
2. **Welcome** — the server registers the participant, assigns a color, and
   replies with the current document + roster.
3. **Edit** — a client sends the full document content on each change; the server
   updates the canonical copy and broadcasts a `doc` message to the room.
4. **Presence** — joins and disconnects trigger a `presence` broadcast so every
   client's roster stays current.

## Components

| Path                     | Role                                              |
|--------------------------|---------------------------------------------------|
| `crates/cosync-server`   | Rust WebSocket server; authoritative room state   |
| `web/`                   | Next.js frontend; connects directly over WebSocket |

## State model

Each `Room` owns its document, a participant map, and a `tokio::sync::broadcast`
channel. Every connected session subscribes a receiver; an edit from any client
is applied to the canonical document and fanned out to all subscribers. Rooms are
created on first join and dropped when the last participant leaves.

## Connection topology

The browser connects to the WebSocket server **directly** (via `NEXT_PUBLIC_WS_URL`),
not through a Next.js rewrite — rewrites proxy HTTP but not WebSocket upgrades
(ADR 0002). In production: frontend on Vercel, server on Fly.io.
