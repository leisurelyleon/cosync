"use client";

import type { ConnectionStatus as Status } from "@/lib/types";

const LABEL: Record<Status, string> = {
  connecting: "Connecting…",
  connected: "Connected",
  reconnecting: "Reconnecting…",
  closed: "Disconnected",
};
const COLOR: Record<Status, string> = {
  connecting: "var(--warn)",
  connected: "var(--ok)",
  reconnecting: "var(--warn)",
  closed: "var(--bad)",
};

export default function ConnectionStatus({ status }: { status: Status }) {
  return (
    <div className="status">
      <span className="dot" style={{ background: COLOR[status] }} />
      <span>{LABEL[status]}</span>
      <style jsx>{`
        .status {
          display: inline-flex; align-items: center; gap: 0.4rem;
          font-size: 0.75rem; color: var(--muted); font-family: var(--mono);
        }
        .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
      `}</style>
    </div>
  );
}
