"use client";

import { useEffect, useState } from "react";
import Editor from "@/components/Editor";
import PresenceBar from "@/components/PresenceBar";
import ConnectionStatus from "@/components/ConnectionStatus";
import { useCosync } from "@/lib/useCosync";

/** Generate a short room id for first-time visitors. */
function randomRoom(): string {
  return Math.random().toString(36).slice(2, 8);
}
/** Generate a friendly default display name. */
function randomName(): string {
  return `guest-${Math.random().toString(36).slice(2, 6)}`;
}

export default function Home() {
  // Resolve the room from the URL hash (e.g. #abc123) so a shared link joins
  // the same room. Falls back to a fresh room. Computed client-side only.
  const [room, setRoom] = useState<string | null>(null);
  const [name] = useState<string>(randomName);

  useEffect(() => {
    const fromHash = window.location.hash.replace(/^#/, "");
    if (fromHash) {
      setRoom(fromHash);
    } else {
      const r = randomRoom();
      window.location.hash = r;
      setRoom(r);
    }
  }, []);

  if (!room) {
    return <main className="loading">Setting up your room…
      <style jsx>{`.loading{padding:2rem;color:var(--muted);font-family:var(--mono);}`}</style>
    </main>;
  }

  return <Room room={room} name={name} />;
}

function Room({ room, name }: { room: string; name: string }) {
  const { status, content, participants, clientId, sendEdit } = useCosync(room, name);
  const [copied, setCopied] = useState(false);

  function shareRoom() {
    void navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <main className="page">
      <header className="head">
        <div className="title-row">
          <h1>cosync</h1>
          <ConnectionStatus status={status} />
        </div>
        <p>
          A real-time collaborative editor. Everyone in room{" "}
          <code>{room}</code> edits the same document live. Open this page in a
          second tab — or share the link — and watch edits sync instantly.
        </p>
        <div className="controls">
          <PresenceBar participants={participants} selfId={clientId} />
          <button onClick={shareRoom}>{copied ? "Link copied!" : "Copy room link"}</button>
        </div>
      </header>

      <Editor
        value={content}
        onChange={sendEdit}
        disabled={status !== "connected"}
      />

      <style jsx>{`
        .page { max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
        .title-row { display: flex; align-items: center; gap: 1rem; }
        .head h1 { font-family: var(--mono); font-size: 1.6rem; margin: 0; }
        .head p {
          color: var(--muted); font-size: 0.9rem; line-height: 1.6;
          margin: 0.75rem 0 1rem; max-width: 65ch;
        }
        .head code { font-family: var(--mono); color: var(--accent); }
        .controls {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 1rem; gap: 1rem; flex-wrap: wrap;
        }
        button {
          background: var(--accent); color: #0d1117; border: none;
          padding: 0.5rem 0.9rem; border-radius: 6px; font-weight: 600;
          cursor: pointer; font-size: 0.8rem; white-space: nowrap;
        }
      `}</style>
    </main>
  );
}
