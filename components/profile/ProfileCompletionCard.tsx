"use client";

// ─── Compact completion widget ─────────────────────────────────────────────
// Shows score + a "Complete My Profile" CTA on /profile/me. All actual
// editing now happens on the dedicated full page at /profile/me/complete
// (components/profile/complete/CompleteProfileShell.tsx) — this component no
// longer opens a modal or renders the per-section grid. See that file for
// the guided step flow and the resume-from-canonical-data logic.

import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import { calculateCompletion } from "@/lib/profile-completion";
import type { CompletionDTO } from "@/features/profiles/types/dto";

const TX = {
  ar: {
    title:       "أكمل ملفك الشخصي",
    score:       (n: number) => `${n}% مكتمل`,
    ctaComplete: "أكمل ملفك",
    lockedFeatures: "ميزات مقفلة",
    unlockAt:    (n: number) => `تفتح عند ${n}%`,
    congrats: {
      title: "🎉 ملفك مكتمل 100%!",
      body:  "أنت الآن مؤهل للظهور في البحث واستقبال عروض العلامات التجارية مباشرة.",
      cta:   "عرض ملفي العام",
    },
  },
  en: {
    title:       "Complete your profile",
    score:       (n: number) => `${n}% complete`,
    ctaComplete: "Complete My Profile",
    lockedFeatures: "Locked features",
    unlockAt:    (n: number) => `Unlocks at ${n}%`,
    congrats: {
      title: "🎉 Profile 100% complete!",
      body:  "You're now eligible to appear in search and receive brand briefs directly.",
      cta:   "View my public page",
    },
  },
};

const GATE_TX: Record<string, { ar: string; en: string }> = {
  applyToJobs:    { ar: "التقديم على الفرص",  en: "Apply to opportunities" },
  appearInSearch: { ar: "الظهور في البحث",    en: "Appear in search" },
  receiveBriefs:  { ar: "استقبال العروض",     en: "Receive direct briefs" },
  becomeVerified: { ar: "شارة التحقق",        en: "Verified badge" },
  postJobs:       { ar: "نشر الفرص",          en: "Post opportunities" },
  contactTalents: { ar: "التواصل مع المواهب", en: "Contact talents" },
};

interface Props {
  profile:        any;
  talentProfile:  any;
  portfolioItems: any[];
  onUpdate:       () => void;
  /** Null means "not loaded yet" — falls back to the local talent calculation for first paint. */
  completion?:    CompletionDTO | null;
}

export default function ProfileCompletionCard({ profile, talentProfile, portfolioItems, completion }: Props) {
  const { lang, dark } = useSite();
  const t = TX[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";
  const router = useRouter();

  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#64748b" : "#94a3b8";
  const BORDER = dark ? "rgba(255,255,255,0.08)" : "#e2e8f0";
  const CARD   = dark ? "#0b1622" : "#ffffff";
  const TEAL   = "#00C9B1";
  const ORANGE = "#FF6B2B";

  const fallback = calculateCompletion(profile, talentProfile, portfolioItems);
  const score    = completion?.score ?? fallback.score;
  const gates    = completion?.gates ?? [];

  if (score >= 100) {
    return (
      <div style={{
        marginBottom: 28, fontFamily: "'Cairo', sans-serif",
        background: dark ? "linear-gradient(135deg,#0a2a1e,#0d1f2d)" : "linear-gradient(135deg,#ecfdf5,#eff6ff)",
        border: `1px solid ${dark ? "rgba(0,210,106,0.25)" : "rgba(0,210,106,0.3)"}`,
        borderRadius: 18, padding: "28px 24px", textAlign: "center",
      }} dir={dir}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
        <h3 style={{ color: dark ? "#f1f5f9" : "#0f172a", fontSize: 20, fontWeight: 800, margin: "0 0 8px" }}>
          {t.congrats.title}
        </h3>
        <p style={{ color: dark ? "#94a3b8" : "#64748b", fontSize: 14, margin: "0 0 20px", lineHeight: 1.7 }}>
          {t.congrats.body}
        </p>
        <a href={`/talent/${profile?.handle}`} style={{
          display: "inline-block", padding: "11px 28px",
          background: "#00C9B1", color: "#fff", borderRadius: 10,
          fontSize: 14, fontWeight: 700, textDecoration: "none",
          fontFamily: "'Cairo', sans-serif",
        }}>
          {t.congrats.cta}
        </a>
      </div>
    );
  }

  const scoreColor = score >= 80 ? "#00D26A" : score >= 50 ? TEAL : score >= 25 ? "#FFB800" : ORANGE;

  return (
    <div style={{ marginBottom: 28, fontFamily: "'Cairo', sans-serif" }} dir={dir}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 14, padding: "16px 18px", borderRadius: 16,
        background: CARD, border: `1px solid ${BORDER}`,
      }}>
        <div style={{ flex: "1 1 220px", minWidth: 180 }}>
          <h3 style={{ color: TEXT, fontSize: 16, fontWeight: 700, margin: "0 0 6px" }}>{t.title}</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, maxWidth: 220 }}>
              <div style={{ height: 8, background: dark ? "rgba(255,255,255,0.06)" : "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${score}%`, background: scoreColor, borderRadius: 4, transition: "width 0.5s ease" }} />
              </div>
            </div>
            <span style={{ color: scoreColor, fontSize: 15, fontWeight: 800 }}>{t.score(score)}</span>
          </div>
        </div>
        <button
          onClick={() => router.push("/profile/me/complete")}
          style={{
            padding: "12px 24px", background: TEAL, border: "none", borderRadius: 12,
            color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
            fontFamily: "'Cairo', sans-serif", whiteSpace: "nowrap",
          }}
        >
          {t.ctaComplete}
        </button>
      </div>

      {(() => {
        const locked = gates
          .filter((gate) => !gate.passed)
          .map((gate) => ({ key: gate.key, label: GATE_TX[gate.key]?.[lang] ?? gate.key, n: gate.minScore }));
        if (!locked.length) return null;
        return (
          <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            <span style={{ color: MUTED, fontSize: 11, fontWeight: 600 }}>{t.lockedFeatures}:</span>
            {locked.map((f) => (
              <span key={f.key} style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "3px 10px", fontSize: 11,
                background: dark ? "rgba(255,107,43,0.08)" : "rgba(255,107,43,0.06)",
                border: "1px solid rgba(255,107,43,0.2)", borderRadius: 20, color: ORANGE,
              }}>
                🔒 {f.label} · {t.unlockAt(f.n)}
              </span>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
