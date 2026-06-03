// TypeScript mirror of crates/cosync-server/src/protocol.rs.

export interface Participant {
  id: string;
  name: string;
  color: string;
}

export type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "closed";
