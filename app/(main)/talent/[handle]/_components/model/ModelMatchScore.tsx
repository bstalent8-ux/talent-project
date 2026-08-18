"use client";

// Port of model/components/RightSidebar.tsx's Match Score card. HARD-CODED —
// there is no real matching algorithm (that would require a target brief/
// request to match against, which a public profile page doesn't have). See
// CLAUDE.md's model-profile report for what's real vs. decorative here.

import { Check, Info } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";

const GOLD = "#d89b37";
const GREEN = "#10b981";

const FACTORS_AR = [
  { name: "Fashion Model", pct: "+30%" },
  { name: "القاهرة", pct: "+15%" },
  { name: "خبرة في التصوير التجاري", pct: "+20%" },
  { name: "متاحة في التاريخ المطلوب", pct: "+15%" },
  { name: "تقييمات ممتازة", pct: "+10%" },
  { name: "سرعة الرد عالية", pct: "+5%" },
  { name: "ملف شخصي مكتمل", pct: "+5%" },
];
const FACTORS_EN = [
  { name: "Fashion Model", pct: "+30%" },
  { name: "Cairo", pct: "+15%" },
  { name: "Commercial shoot experience", pct: "+20%" },
  { name: "Available on requested date", pct: "+15%" },
  { name: "Excellent reviews", pct: "+10%" },
  { name: "Fast response", pct: "+5%" },
  { name: "Complete profile", pct: "+5%" },
];
const SCORE = 92;
const RADIUS = 42;
const CIRC = 2 * Math.PI * RADIUS;

export default function ModelMatchScore() {
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = dark ? "var(--bg-card)" : "#FFFFFF";
  const BORDER = dark ? "var(--border-subtle)" : "#E2E8F0";
  const TEXT = dark ? "var(--text-primary)" : "#0F172A";
  const MUTED = dark ? "var(--text-muted)" : "#64748B";
  const factors = ar ? FACTORS_AR : FACTORS_EN;

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
      <h3 style={{ color: TEXT, fontSize: 14, fontWeight: 800, textAlign: "center", margin: "0 0 16px" }}>
        {ar ? "مدى المطابقة مع طلبك" : "Match with your request"}
      </h3>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
        <div style={{ position: "relative", width: 140, height: 140 }}>
          <svg width={140} height={140} viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="50" cy="50" r={RADIUS} stroke={dark ? "#172236" : "#E2E8F0"} strokeWidth="7" fill="none" />
            <circle
              cx="50" cy="50" r={RADIUS} stroke={GREEN} strokeWidth="7" fill="none"
              strokeDasharray={CIRC} strokeDashoffset={CIRC - (CIRC * SCORE) / 100} strokeLinecap="round"
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: TEXT, fontSize: 30, fontWeight: 900 }}>{SCORE}%</span>
            <span style={{ color: MUTED, fontSize: 12, fontWeight: 700 }}>Match</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        {factors.map((f) => (
          <div key={f.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 16, height: 16, borderRadius: "50%", backgroundColor: "rgba(16,185,129,0.14)", border: `1px solid ${GREEN}66`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Check size={10} color={GREEN} />
              </span>
              <span style={{ color: MUTED, fontWeight: 600 }}>{f.name}</span>
            </div>
            <span style={{ color: GREEN, fontWeight: 800, fontFamily: "monospace" }}>{f.pct}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "none", border: "none", color: GOLD, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: "6px 0", fontFamily: "'Cairo',sans-serif" }}
      >
        <Info size={13} />{ar ? "لماذا هذه النسبة؟" : "Why this score?"}
      </button>
    </div>
  );
}
