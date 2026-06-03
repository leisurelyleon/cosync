# 3. Presence model and conflict-handling roadmap

- Status: Accepted

## Context

Two related concerns: how to represent "who's here," and how far to take conflict
resolution.

## Decision

**Presence:** each participant gets a server-assigned id (UUID) and a color from a
fixed palette, broadcast to the room on every join/leave via a `presence` message.
The client renders a roster of colored avatars.

**Conflict handling:** deliberately scoped to last-write-wins for v1 (see ADR 0001).
Live cursors and character-level merge are explicitly out of scope for the initial
version.

## Consequences

- (+) Presence is simple and immediately useful (you can see who's in the room).
- (+) A clear, honest boundary on what v1 does and does not do.
- (-) No live remote cursors yet; no concurrent-edit merging.
- Future: live cursor positions (broadcast cursor offsets) and a CRDT-backed
  document for true concurrent editing.
