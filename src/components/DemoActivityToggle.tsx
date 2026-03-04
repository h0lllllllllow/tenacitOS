"use client";

import { useEffect, useState } from "react";

export function DemoActivityToggle() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/demo-activity", { cache: "no-store", credentials: "include" })
      .then((r) => r.json())
      .then((data) => setEnabled(!!data.enabled))
      .finally(() => setLoading(false));
  }, []);

  const onToggle = async (next: boolean) => {
    setEnabled(next);
    await fetch("/api/demo-activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ enabled: next }),
    }).catch(() => {
      setEnabled(!next);
    });
  };

  return (
    <div className="p-4 rounded-xl" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
            Demo Activity Mode
          </h3>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Server-generated simulated feed events every ~15s.
          </p>
        </div>
        <button
          disabled={loading}
          onClick={() => onToggle(!enabled)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-60"
          style={{
            backgroundColor: enabled ? "var(--accent-soft)" : "var(--surface-elevated)",
            color: enabled ? "var(--accent)" : "var(--text-secondary)",
            border: "1px solid var(--border)",
          }}
        >
          {enabled ? "ON" : "OFF"}
        </button>
      </div>
    </div>
  );
}
