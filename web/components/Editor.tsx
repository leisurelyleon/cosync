"use client";

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

export default function Editor({ value, onChange, disabled }: EditorProps) {
  return (
    <div className="editor">
      <textarea
        className="area"
        spellCheck={false}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={disabled ? "Connecting…" : "Start typing — everyone in this room sees it live"}
      />
      <style jsx>{`
        .editor { display: flex; flex-direction: column; flex: 1; }
        .area {
          flex: 1; min-height: 420px; resize: vertical;
          background: var(--panel); color: var(--text);
          border: 1px solid var(--border); border-radius: 8px;
          padding: 1rem; font-family: var(--mono); font-size: 0.9rem;
          line-height: 1.6; tab-size: 2;
        }
        .area:focus { outline: 1px solid var(--accent); outline-offset: -1px; }
        .area:disabled { opacity: 0.6; }
      `}</style>
    </div>
  );
}
