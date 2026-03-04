"use client";

import { useEffect, useState } from "react";
import { DEFAULT_THEME, isThemeId, THEME_STORAGE_KEY, THEMES, type ThemeId } from "@/lib/theme";

function getInitialTheme(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  return isThemeId(saved) ? saved : DEFAULT_THEME;
}

export function ThemeSelector() {
  const [theme, setTheme] = useState<ThemeId>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const applyTheme = (next: ThemeId) => {
    setTheme(next);
  };

  return (
    <div
      className="p-4 rounded-xl"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
    >
      <h3
        className="text-sm font-semibold mb-3"
        style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}
      >
        Theme
      </h3>
      <div className="flex flex-wrap gap-2">
        {THEMES.map((item) => (
          <button
            key={item.id}
            onClick={() => applyTheme(item.id)}
            className="px-3 py-2 rounded-lg text-xs md:text-sm transition-colors"
            style={{
              border: "1px solid var(--border)",
              backgroundColor: theme === item.id ? "var(--accent-soft)" : "var(--surface-elevated)",
              color: theme === item.id ? "var(--accent)" : "var(--text-secondary)",
              fontWeight: theme === item.id ? 600 : 500,
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
