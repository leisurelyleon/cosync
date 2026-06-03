"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ClientMessage, ServerMessage } from "@/lib/protocol";
import type { ConnectionStatus, Participant } from "@/lib/types";

/**
 * Connect to the cosync server for a room and keep the shared document +
 * presence roster in sync. URL comes from NEXT_PUBLIC_WS_URL (e.g.
 * wss://app.fly.dev); defaults to ws://localhost:8080 for non-Codespaces local.
 */
export function useCosync(room: string, name: string) {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [content, setContent] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const lastSentRef = useRef<string>("");

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080";
    const url = `${base}/ws/${encodeURIComponent(room)}`;

    const ws = new WebSocket(url);
    socketRef.current = ws;
    setStatus("connecting");

    ws.onopen = () => {
      setStatus("connected");
      const hello: ClientMessage = { type: "hello", name };
      ws.send(JSON.stringify(hello));
    };

    ws.onmessage = (event) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(event.data as string) as ServerMessage;
      } catch {
        return; // ignore anything that isn't valid JSON
      }
      switch (msg.type) {
        case "welcome":
          setClientId(msg.client_id);
          setContent(msg.content);
          lastSentRef.current = msg.content;
          setParticipants(msg.participants);
          break;
        case "doc":
          setContent(msg.content);
          lastSentRef.current = msg.content;
          break;
        case "presence":
          setParticipants(msg.participants);
          break;
      }
    };

    // Only report a drop if THIS socket is still the active one — guards against
    // Strict Mode's mount/cleanup/mount cycle flashing "Disconnected" when the
    // first, intentionally-discarded socket closes.
    ws.onclose = () => {
      if (socketRef.current === ws) setStatus("closed");
    };
    ws.onerror = () => {
      if (socketRef.current === ws) setStatus("closed");
    };

    return () => {
      // Clear the ref and detach handlers before closing, so the impending
      // close can't mutate state for a socket we're deliberately tearing down.
      if (socketRef.current === ws) socketRef.current = null;
      ws.onopen = null;
      ws.onclose = null;
      ws.onerror = null;
      ws.onmessage = null;
      ws.close();
    };
  }, [room, name]);

  /** Send a local edit to the server (which broadcasts it back). */
  const sendEdit = useCallback((next: string) => {
    setContent(next); // optimistic local update for responsiveness
    const ws = socketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN && next !== lastSentRef.current) {
      lastSentRef.current = next;
      const edit: ClientMessage = { type: "edit", content: next };
      ws.send(JSON.stringify(edit));
    }
  }, []);

  return { status, content, participants, clientId, sendEdit };
}
