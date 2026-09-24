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
  const VIOLET = "var(--color-primary-text)"; // site --color-accent, was violet

  if (tabs.length < 2) return null;

  return (
    <div style={{
      position: "sticky", top: 62, zIndex: 30,
      backgroundColor: dark ? "rgba(43,33,29,0.95)" : "rgba(251,247,234,0.95)",
      backdropFilter: "blur(10px)",
      border: `1px solid ${dark ? "rgba(79,167,163,0.15)" : "#E6DCC3"}`,
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
              backgroundColor: isActive ? `color-mix(in srgb, ${VIOLET} 10%, transparent)` : "transparent",
              color: isActive ? VIOLET : dark ? "#A99B8E" : "#6E5F55",
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
