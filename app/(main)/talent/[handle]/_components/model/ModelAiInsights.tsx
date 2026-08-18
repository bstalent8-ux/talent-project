"use client";

// No recommendation engine exists — shown as an honest "coming soon"
// placeholder instead of fabricated insight text (was previously 3
// hardcoded suggestions).

import { Sparkles } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";

const GOLD = "#d89b37";

export default function ModelAiInsights() {
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = dark ? "var(--bg-card)" : "#FFFFFF";
  const BORDER = dark ? "var(--border-subtle)" : "#E2E8F0";
  const TEXT = dark ? "var(--text-primary)" : "#0F172A";
  const MUTED = dark ? "var(--text-muted)" : "#64748B";

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20, textAlign: "center" }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: "rgba(216,155,55,0.14)", border: `1px solid ${GOLD}55`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
        <Sparkles size={18} color={GOLD} />
      </div>
      <h3 style={{ color: TEXT, fontSize: 14, fontWeight: 800, margin: "0 0 4px" }}>
        {ar ? "AI Insights من Talents" : "AI Insights from Talents"}
      </h3>
      <p style={{ color: MUTED, fontSize: 12, margin: 0 }}>
        {ar ? "قريباً" : "Coming Soon"}
      </p>
    </div>
  );
}
