"use client";

import { useRef, useState } from "react";
import { StickyNote, Trash2 } from "lucide-react";

const STORAGE_KEY = "tenacitas-notepad";

function getInitialState() {
  if (typeof window === "undefined") {
    return { text: "", lastSaved: null as Date | null };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { text: "", lastSaved: null as Date | null };
    const parsed = JSON.parse(raw);
    return {
      text: parsed.text || "",
      lastSaved: parsed.ts ? new Date(parsed.ts) : null,
    };
  } catch {
    return { text: "", lastSaved: null as Date | null };
  }
}

export function Notepad() {
  const initial = getInitialState();
  const [text, setText] = useState(initial.text);
  const [saved, setSaved] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(initial.lastSaved);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const persist = (value: string) => {
    const now = new Date();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ text: value, ts: now.toISOString() }));
    setSaved(true);
    setLastSaved(now);
  };

  const handleChange = (value: string) => {
    setText(value);
    setSaved(false);

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => persist(value), 2000);
  };

  const clear = () => {
    setText("");
    localStorage.removeItem(STORAGE_KEY);
    setSaved(true);
    setLastSaved(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", backgroundColor: "var(--card)", borderRadius: "0.75rem", border: "1px solid var(--border)", overflow: "hidden", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 0.875rem", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <StickyNote className="w-3.5 h-3.5" style={{ color: "#fbbf24", flexShrink: 0 }} />
        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", flex: 1, fontWeight: 500 }}>Notepad</span>
        {!saved && <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>saving...</span>}
        {saved && lastSaved && (
          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
            saved {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
        <button onClick={clear} title="Clear" style={{ padding: "0.2rem", borderRadius: "0.25rem", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      <textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Quick notes, reminders, ideas..."
        style={{ flex: 1, resize: "none", border: "none", outline: "none", padding: "0.75rem", backgroundColor: "transparent", color: "var(--text-primary)", fontSize: "0.8rem", lineHeight: 1.6, fontFamily: "var(--font-body, sans-serif)", minHeight: "120px" }}
      />
    </div>
  );
}
