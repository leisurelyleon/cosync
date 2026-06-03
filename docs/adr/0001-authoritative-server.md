# 1. Authoritative server, full-document sync

- Status: Accepted

## Context

A collaborative editor needs a conflict strategy. The options range from a simple
authoritative server (last-write-wins on whole-document state) to operational
transforms (OT) or CRDTs that merge concurrent character-level edits.

## Decision

Start with an authoritative server: the server holds the canonical document, and
each client sends the full content on change. The server applies it and broadcasts
the result. No per-character merge logic.

## Consequences

- (+) Simple, reliable, and easy to reason about — no subtle merge bugs.
- (+) The server is the single source of truth; clients converge on its state.
- (-) Last-write-wins means simultaneous edits to the same document can clobber
  each other; there is no character-level merge.
- (-) Sending full document content per edit is fine for modest documents, less so
  for very large ones.
- Future: a CRDT (e.g. via `yrs`/Yjs) would enable true concurrent merging — see
  ADR 0003.
