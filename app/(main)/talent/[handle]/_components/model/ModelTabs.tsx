"use client";

// Sticky quick-nav pill row — same pattern as UgcTabs.tsx (click scrolls to
// the section anchor, active state set on click only, no scrollspy), gold
// accent to match the Model page instead of UGC's violet.

import { useSite } from "@/contexts/SiteContext";

const GOLD = "var(--color-accent-strong)";

export interface ModelTab {
  key: string;
  label: string;
  anchor: string;
}

interface Props {
  tabs: ModelTab[];
  active: string;
  onChange: (key: string) => void;
}

export default function ModelTabs({ tabs, active, onChange }: Props) {
  const { dark } = useSite();

  if (tabs.length < 2) return null;

  return (
    <div style={{
      position: "sticky", top: 62, zIndex: 30,
      backgroundColor: dark ? "rgba(43,33,29,0.95)" : "rgba(255,255,255,0.95)",
      backdropFilter: "blur(10px)",
      border: `1px solid ${dark ? "var(--border-subtle)" : "#E6DCC3"}`,
      borderRadius: 14, padding: "6px 8px",
      display: "flex", alignItems: "center", gap: 4, overflowX: "auto",
    }}>
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => {
              onChange(tab.key);
              const el = document.getElementById(tab.anchor);
              if (el) {
                const y = el.getBoundingClientRect().top + window.pageYOffset - 120;
                window.scrollTo({ top: y, behavior: "smooth" });
              }
            }}
            style={{
              padding: "8px 14px", borderRadius: 10, border: "none", whiteSpace: "nowrap",
              backgroundColor: isActive ? `color-mix(in srgb, ${GOLD} 10%, transparent)` : "transparent",
              color: isActive ? GOLD : dark ? "var(--text-muted)" : "#6E5F55",
              fontWeight: isActive ? 800 : 600, fontSize: 13, cursor: "pointer",
              fontFamily: "'IBM Plex Sans Arabic',sans-serif",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
