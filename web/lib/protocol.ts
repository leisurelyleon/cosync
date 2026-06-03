import type { Participant } from "@/lib/types";

// Messages the client SENDS (mirror of ClientMessage in protocol.rs).
export type ClientMessage =
  | { type: "hello"; name: string }
  | { type: "edit"; content: string };

// Messages the client RECEIVES (mirror of ServerMessage in protocol.rs).
export type ServerMessage =
  | {
      type: "welcome";
      client_id: string;
      content: string;
      participants: Participant[];
    }
  | { type: "doc"; content: string; from: string }
  | { type: "presence"; participants: Participant[] };
