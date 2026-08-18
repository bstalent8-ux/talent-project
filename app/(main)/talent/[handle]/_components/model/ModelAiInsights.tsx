"use client";

// Port of model/components/RightSidebar.tsx's AI Insights card. HARD-CODED —
// no recommendation engine exists. See CLAUDE.md's model-profile report.

import { useSite } from "@/contexts/SiteContext";

const GOLD = "#d89b37";

const INSIGHTS_AR = [
  "أنت ضمن أفضل 7% من الموديلات في فئة Fashion Model في مصر",
  "نوصيك بإضافة محتوى خارجي (Outdoor) لزيادة فرصك في الحملات الخارجية",
  "أوقاتك المتاحة في نهاية هذا الأسبوع عالية الطلب. فكّر في تعديل توافرك",
];
const INSIGHTS_EN = [
  "You're in the top 7% of Fashion Models in Egypt",
  "Adding outdoor content could raise your chances for outdoor campaigns",
  "Your slots later this week are in high demand — consider adjusting availability",
];

export default function ModelAiInsights() {
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = dark ? "var(--bg-card)" : "#FFFFFF";
  const BORDER = dark ? "var(--border-subtle)" : "#E2E8F0";
  const SURFACE = dark ? "var(--bg-card-muted)" : "#F8FAFC";
  const TEXT = dark ? "var(--text-primary)" : "#0F172A";
  const MUTED = dark ? "var(--text-muted)" : "#64748B";
  const insights = ar ? INSIGHTS_AR : INSIGHTS_EN;

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: "rgba(216,155,55,0.14)", border: `1px solid ${GOLD}66`, color: GOLD, fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>AI</span>
        <h3 style={{ color: TEXT, fontSize: 14, fontWeight: 800, margin: 0 }}>{ar ? "AI Insights من Talents" : "AI Insights from Talents"}</h3>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
        {insights.map((text, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 10 }}>
            <span style={{ width: 18, height: 18, borderRadius: 5, backgroundColor: "rgba(216,155,55,0.14)", border: `1px solid ${GOLD}66`, color: GOLD, fontSize: 8.5, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>AI</span>
            <p style={{ color: MUTED, fontSize: 12, lineHeight: 1.6, margin: 0 }}>{text}</p>
          </div>
        ))}
      </div>

      <button type="button" style={{ width: "100%", padding: "9px 0", backgroundColor: SURFACE, color: GOLD, border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
        {ar ? "عرض كل التوصيات" : "View all recommendations"}
      </button>
    </div>
  );
}
