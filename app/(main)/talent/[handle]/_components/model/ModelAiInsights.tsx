"use client";

// ─── AI Insights from Talents ──────────────────────────────────────────────
// Card built to the approved reference, with its exact copy. The three tips are
// FIXED sample text shown on every model, by explicit request — there is no
// recommendation engine or ranking behind them ("top 7%", "high demand" ...).
// "View all recommendations" reveals a note saying so.

import { useState } from "react";
import { useSite } from "@/contexts/SiteContext";

const GOLD = "var(--color-accent-strong)";

const TIPS = {
  ar: [
    "أنت ضمن أفضل 7% من الموديلات في فئة Fashion Model في مصر.",
    "نوصيك بإضافة محتوى خارجي (Outdoor) لزيادة فرصتك في الحملات الخارجية.",
    "أوقاتك المتاحة في نهاية هذا الأسبوع عالية الطلب، فكّر في تعديل توافرك.",
  ],
  en: [
    "You rank in the top 7% of Fashion Models in Egypt.",
    "We recommend adding outdoor content to increase your chances in outdoor campaigns.",
    "Your availability this weekend is in high demand — consider adjusting your schedule.",
  ],
};

function AiMark({ size }: { size: number }) {
  return (
    <span style={{ width: size, height: size, borderRadius: "50%", border: `1.5px solid ${GOLD}`, backgroundColor: "rgba(231,165,138,0.12)", color: GOLD, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 800, flexShrink: 0, letterSpacing: 0.2 }}>
      AI
    </span>
  );
}

export default function ModelAiInsights() {
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = dark ? "var(--bg-card)" : "#FBF7EA";
  const BORDER = dark ? "var(--border-subtle)" : "#E6DCC3";
  const TEXT = dark ? "var(--text-primary)" : "#2B211D";
  const MUTED = dark ? "var(--text-muted)" : "#6E5F55";
  const [note, setNote] = useState(false);

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22 }}>
      <h3 style={{ color: TEXT, fontSize: 16, fontWeight: 800, margin: "0 0 18px", display: "flex", alignItems: "center", gap: 10 }}>
        <AiMark size={30} />
        <span><span style={{ color: GOLD }}>AI Insights</span> {ar ? "من Talents" : "from Talents"}</span>
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {TIPS[ar ? "ar" : "en"].map((tip) => (
          <div key={tip} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <AiMark size={26} />
            <p style={{ color: TEXT, fontSize: 13.5, lineHeight: 1.75, margin: 0 }}>{tip}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setNote((n) => !n)}
        aria-expanded={note}
        style={{ width: "100%", marginTop: 20, padding: "11px 0", borderRadius: 10, border: `1px solid ${GOLD}`, backgroundColor: "transparent", color: GOLD, fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "'IBM Plex Sans Arabic',sans-serif" }}
      >
        {ar ? "عرض كل التوصيات" : "View all recommendations"}
      </button>
      {note && (
        <p style={{ color: MUTED, fontSize: 12, lineHeight: 1.7, margin: "12px 0 0" }}>
          {ar
            ? "دي توصيات توضيحية لشكل الميزة. التوصيات الحقيقية هتظهر لما الميزة تشتغل."
            : "These are sample tips showing how the feature will look. Real recommendations appear once it launches."}
        </p>
      )}
    </div>
  );
}
