"use client";

// AI match-scoring needs a target brief/request to match against, which a
// public profile page doesn't have — there is no real matching algorithm
// today. Shown as an honest "coming soon" placeholder instead of a fake
// score (was previously a hardcoded 92% + factor breakdown).

import { Sparkles } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";

const GOLD = "var(--color-accent-strong)";

export default function ModelMatchScore() {
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = dark ? "var(--bg-card)" : "#FBF7EA";
  const BORDER = dark ? "var(--border-subtle)" : "#E6DCC3";
  const TEXT = dark ? "var(--text-primary)" : "#2B211D";
  const MUTED = dark ? "var(--text-muted)" : "#6E5F55";

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20, textAlign: "center" }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: "rgba(231,165,138,0.14)", border: `1px solid color-mix(in srgb, ${GOLD} 33%, transparent)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
        <Sparkles size={18} color={GOLD} />
      </div>
      <h3 style={{ color: TEXT, fontSize: 14, fontWeight: 800, margin: "0 0 4px" }}>
        {ar ? "درجة التطابق مع طلبك" : "Match score"}
      </h3>
      <p style={{ color: MUTED, fontSize: 12, margin: 0 }}>
        {ar ? "قريباً" : "Coming Soon"}
      </p>
    </div>
  );
}
