"use client";

// Port of ugc/untitled/components/QuickTabs.tsx — sticky pill row, click
// scrolls to the section anchor. Source has no scrollspy (active state is
// set on click only); kept identical rather than adding one.

import { useSite } from "@/contexts/SiteContext";

export interface UgcTab {
  key: string;
  label: string;
  anchor: string;
}

interface Props {
  tabs: UgcTab[];
  active: string;
  onChange: (key: string) => void;
}

export default function UgcTabs({ tabs, active, onChange }: Props) {
  const { dark } = useSite();
  const VIOLET = "#16a3a3"; // site --color-accent, was violet

  if (tabs.length < 2) return null;

  return (
    <div style={{
      position: "sticky", top: 62, zIndex: 30,
      backgroundColor: dark ? "rgba(13,22,35,0.95)" : "rgba(255,255,255,0.95)",
      backdropFilter: "blur(10px)",
      border: `1px solid ${dark ? "rgba(0,255,163,0.15)" : "#E2E8F0"}`,
      borderRadius: 14, padding: "6px 8px", marginBottom: 20,
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
              backgroundColor: isActive ? `${VIOLET}1a` : "transparent",
              color: isActive ? VIOLET : dark ? "#A8B3C2" : "#64748B",
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
