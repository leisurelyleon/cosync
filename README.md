# cosync

A **real-time collaborative editor**. Multiple users join a room, edit a shared
document, and see each other's changes live — with presence showing who's
connected. The Rust server holds the authoritative document and broadcasts
ordered edits to everyone in the room.

## How it works

- **Authoritative WebSocket server** (Rust, axum + tokio). Each room owns its
  document and a broadcast channel; edits are applied server-side and fanned out
  to all participants. (ADR 0001)
- **Direct WebSocket connection.** The browser connects straight to the server via
  `NEXT_PUBLIC_WS_URL` — Next.js rewrites can't proxy WebSocket upgrades. (ADR 0002)
- **Presence.** Participants get a color and appear in a live roster; joins and
  leaves broadcast to the room. (ADR 0003)

## Layout

| Path                   | What it is                              |
|------------------------|-----------------------------------------|
| `crates/cosync-server` | Rust WebSocket server                   |
| `web/`                 | Next.js frontend                        |
| `docs/`                | Architecture + ADRs                     |

## Develop

Prerequisites: Rust and Node 20+. (A `.devcontainer` ships both.)

```bash
# Server (listens on :8080)
cargo run -p cosync-server

# Frontend, in another terminal
cd web
npm install
# point the client at the server:
echo "NEXT_PUBLIC_WS_URL=ws://localhost:8080" > .env.local
npm run dev      # http://localhost:3000
```

Open the page in two tabs — type in one, watch it sync to the other.

## Deploy

- **Server** -> Fly.io (always-on; WebSockets need a persistent machine).
- **Frontend** -> Vercel, Root Directory = `web`, with `NEXT_PUBLIC_WS_URL` set to
  the `wss://` Fly URL.

## Status

- [x] Authoritative WebSocket server
- [x] Live document sync + presence
- [ ] Deployed (Fly.io + Vercel)
- [ ] Live cursors / CRDT merge (ADR 0003)
