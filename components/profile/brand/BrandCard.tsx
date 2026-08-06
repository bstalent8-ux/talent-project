"use client";

// ─── BrandCard ────────────────────────────────────────────────────────────────
// The shared chrome for every brand core section: card surface, icon, heading.
//
// Extracted because the brand sections are five near-identical cards, and the
// alternative — repeating the colour constants and the border/radius/padding
// triple in each — is exactly the drift that makes a redesign a five-file edit.
// The talent components each own their chrome for historical reasons; new brand
// UI does not have to inherit that.

import type { ReactNode } from "react";
import { useSite } from "@/contexts/SiteContext";

export function useBrandPalette() {
  const { dark, lang } = useSite();
  return {
    ar:     lang === "ar",
    dark,
    CARD:   dark ? "#0D1623" : "#FFFFFF",
    BORDER: dark ? "rgba(0,255,163,0.15)" : "#E2E8F0",
    TEXT:   dark ? "#F8FAFC" : "#0F172A",
    MUTED:  dark ? "#A8B3C2" : "#64748B",
    GREEN:  "#00D26A",
  };
}

export default function BrandCard({
  icon,
  title,
  children,
}: {
  icon:     ReactNode;
  title:    string;
  children: ReactNode;
}) {
  const { CARD, BORDER, TEXT } = useBrandPalette();

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        {icon}
        <h3 style={{ color: TEXT, fontSize: 16, fontWeight: 800, margin: 0 }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}
