"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ClientMessage, ServerMessage } from "@/lib/protocol";
import type { ConnectionStatus, Participant } from "@/lib/types";

/**
 * Connect to the cosync server for a given room and keep the shared document
 * + presence roster in sync.
 *
 * The WebSocket URL comes from NEXT_PUBLIC_WS_URL (e.g. wss://app.fly.dev).
 * In local dev it defaults to the :8080 server over plain ws://.
 */
export function useCosync(room: string, name: string) {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [content, setContent] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  // Guards against echoing a server doc-update straight back as a new edit,
  // and against React 18 Strict Mode's intentional double-mount in dev.
  const closingRef = useRef(false);
  const lastSentRef = useRef<string>("");

  useEffect(() => {
    closingRef.current = false;

    const base =
      process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080";
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
          // Adopt the authoritative content from the server.
          setContent(msg.content);
          lastSentRef.current = msg.content;
          break;
        case "presence":
          setParticipants(msg.participants);
          break;
      }
    };

    ws.onclose = () => {
      // Only show "closed" for an unexpected drop, not our own cleanup.
      if (!closingRef.current) setStatus("closed");
    };

    ws.onerror = () => {
      if (!closingRef.current) setStatus("closed");
    };

    return () => {
      closingRef.current = true;
      ws.close();
      socketRef.current = null;
    };
  }, [room, name]);

  /** Send a local edit to the server (which will broadcast it back). */
  const sendEdit = useCallback((next: string) => {
    setContent(next); // optimistic local update for a responsive feel
    const ws = socketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN && next !== lastSentRef.current) {
      lastSentRef.current = next;
      const edit: ClientMessage = { type: "edit", content: next };
      ws.send(JSON.stringify(edit));
    }
  }, []);

  return { status, content, participants, clientId, sendEdit };
}
