# cosync
Real-time collaborative editor — multiple users edit a shared document live, with presence (who's online + live cursors). Rust WebSocket server (axum/tokio) holds authoritative room state and broadcasts ordered edits; Next.js/TypeScript frontend. Backend on Fly.io, frontend on Vercel.
