# 2. Connect to the WebSocket server directly

- Status: Accepted

## Context

In `kcl-diff`, the frontend reached its backend through a Next.js `rewrites()`
proxy (`/api/diff` -> the service). The natural instinct was to reuse that here.
But Next.js rewrites proxy **HTTP** requests; they do not handle the WebSocket
upgrade handshake. A proxied `/ws` path silently fails to establish a socket.

## Decision

The browser connects to the WebSocket server directly using a public env var,
`NEXT_PUBLIC_WS_URL` (e.g. `wss://cosync-yourname.fly.dev`). No proxy layer.

## Consequences

- (+) The WebSocket upgrade works reliably end to end.
- (+) Clear separation: the frontend is static hosting; the server owns sockets.
- (-) The server must allow cross-origin WebSocket connections (CORS is permissive;
  the browser also enforces `wss://` from an `https://` page).
- (-) The frontend needs the server URL injected at build time via the
  `NEXT_PUBLIC_` prefix.
