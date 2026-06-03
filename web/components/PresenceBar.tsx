"use client";

import type { Participant } from "@/lib/types";

export default function PresenceBar({
  participants,
  selfId,
}: {
  participants: Participant[];
  selfId: string | null;
}) {
  return (
    <div className="presence">
      <span className="count">
        {participants.length} {participants.length === 1 ? "person" : "people"} here
      </span>
      <div className="avatars">
        {participants.map((p) => (
          <span
            key={p.id}
            className="avatar"
            style={{ background: p.color }}
            title={p.id === selfId ? `${p.name} (you)` : p.name}
          >
            {p.name.slice(0, 1).toUpperCase()}
          </span>
        ))}
      </div>
      <style jsx>{`
        .presence { display: flex; align-items: center; gap: 0.75rem; }
        .count { font-size: 0.75rem; color: var(--muted); font-family: var(--mono); }
        .avatars { display: flex; gap: 0.3rem; }
        .avatar {
          width: 24px; height: 24px; border-radius: 50%;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 0.7rem; font-weight: 700; color: #0d1117;
        }
      `}</style>
    </div>
  );
}
