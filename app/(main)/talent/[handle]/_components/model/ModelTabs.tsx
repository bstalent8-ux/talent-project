"use client";

// Sticky quick-nav pill row — same pattern as UgcTabs.tsx (click scrolls to
// the section anchor, active state set on click only, no scrollspy), gold
// accent to match the Model page instead of UGC's violet.

import { useSite } from "@/contexts/SiteContext";

const GOLD = "#d89b37";

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
      backgroundColor: dark ? "rgba(13,22,35,0.95)" : "rgba(255,255,255,0.95)",
      backdropFilter: "blur(10px)",
      border: `1px solid ${dark ? "var(--border-subtle)" : "#E2E8F0"}`,
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
              backgroundColor: isActive ? `${GOLD}1a` : "transparent",
              color: isActive ? GOLD : dark ? "var(--text-muted)" : "#64748B",
              fontWeight: isActive ? 800 : 600, fontSize: 13, cursor: "pointer",
              fontFamily: "'Cairo',sans-serif",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
