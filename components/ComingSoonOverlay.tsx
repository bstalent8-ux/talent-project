"use client";

// Full block for a page that's live in the code but not ready to show real
// users yet — the real content still renders underneath (server data fetch
// included) so removing this wrapper later is a one-line revert, but it's
// blurred and non-interactive, with a "Coming soon" card pinned over it.
// Used by /community, /brands, /jobs — see each page.tsx.

import Link from "next/link";
import { Clock3 } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";

const TX = {
  ar: {
    badge: "قريباً",
    title: "هذه الصفحة قادمة قريباً",
    text: "بنجهز القسم ده دلوقتي. تابعنا قريباً لمزيد من التحديثات.",
    back: "الرئيسية",
  },
  en: {
    badge: "Coming soon",
    title: "This page is coming soon",
    text: "We're putting the finishing touches on this section. Check back soon.",
    back: "Back to home",
  },
};

export default function ComingSoonOverlay({ children }: { children: React.ReactNode }) {
  const { dark, lang } = useSite();
  const t = TX[lang];

  const CARD   = dark ? "#2B211D" : "#FBF7EA";
  const BORDER = dark ? "#3A2E28" : "#E6DCC3";
  const TEXT   = dark ? "#F5EEDB" : "#2B211D";
  const MUTED  = dark ? "#A99B8E" : "#6E5F55";
  const BACKDROP = dark ? "rgba(27,19,16,0.6)" : "rgba(245,238,219,0.65)";

  return (
    <div style={{ position: "relative", minHeight: "70vh" }}>
      <div
        aria-hidden="true"
        inert
        style={{ filter: "blur(10px)", pointerEvents: "none", userSelect: "none" }}
      >
        {children}
      </div>

      <div
        style={{
          position: "fixed",
          inset: 0,
          top: 0,
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          background: BACKDROP,
          backdropFilter: "blur(2px)",
        }}
      >
        <div
          style={{
            width: "min(380px, 100%)",
            textAlign: "center",
            background: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: 16,
            padding: "2rem 1.75rem",
            boxShadow: "0 24px 70px rgba(0,0,0,0.28)",
          }}
        >
          <div
            style={{
              width: 48, height: 48, margin: "0 auto 1rem",
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: "50%",
              background: "var(--color-accent-soft)",
              color: "var(--color-accent-strong)",
            }}
          >
            <Clock3 size={22} />
          </div>

          <span
            style={{
              display: "inline-block", marginBottom: 10,
              padding: "0.3rem 0.75rem", borderRadius: 999,
              background: "var(--color-accent-soft)",
              color: "var(--color-accent-strong)",
              fontSize: 12, fontWeight: 800,
            }}
          >
            {t.badge}
          </span>

          <h1 style={{ margin: "0 0 0.5rem", fontSize: 20, fontWeight: 800, color: TEXT }}>
            {t.title}
          </h1>
          <p style={{ margin: "0 0 1.25rem", fontSize: 14, lineHeight: 1.7, color: MUTED }}>
            {t.text}
          </p>

          <Link
            href="/home"
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              minHeight: "2.6rem", padding: "0 1.25rem", borderRadius: 8,
              background: "var(--color-primary)", color: "var(--color-primary-ink)",
              fontWeight: 800, fontSize: 14, textDecoration: "none",
            }}
          >
            {t.back}
          </Link>
        </div>
      </div>
    </div>
  );
}
