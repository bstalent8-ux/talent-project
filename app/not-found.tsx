"use client";

export const runtime = 'edge';

// Next.js auto-generates a /_not-found route for every project; without a
// custom one here, that implicit route isn't edge-compatible, and
// @cloudflare/next-on-pages hard-fails the whole build with "The following
// routes were not configured to run with the Edge Runtime: - /_not-found"
// (every other route in the app already exports runtime='edge' — this was
// the one gap). This file is that fix — every Cloudflare Pages deploy since
// at least commit b23e7bc has been failing on exactly this.

import Link from "next/link";
import { useSite } from "@/contexts/SiteContext";

const TX = {
  ar: {
    title: "الصفحة غير موجودة",
    sub: "الرابط اللي فتحته مش موجود أو اتنقل لمكان تاني.",
    home: "الرجوع للرئيسية",
  },
  en: {
    title: "Page not found",
    sub: "The link you opened doesn't exist or has moved.",
    home: "Back to home",
  },
};

export default function NotFound() {
  const { dark, lang } = useSite();
  const ar = lang === "ar";
  const t = TX[lang];

  const BG     = dark ? "#1B1310" : "#F5EEDB";
  const CARD   = dark ? "#2B211D" : "#FBF7EA";
  const BORDER = dark ? "#3A2E28" : "#E6DCC3";
  const TEXT   = dark ? "#F5EEDB" : "#2B211D";
  const MUTED  = dark ? "#A99B8E" : "#6E5F55";
  const GREEN  = "var(--color-primary-text)";

  return (
    <div
      dir={ar ? "rtl" : "ltr"}
      style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        backgroundColor: BG, fontFamily: "'IBM Plex Sans Arabic', sans-serif", padding: 24,
      }}
    >
      <div style={{
        backgroundColor: CARD, border: `1px solid ${BORDER}`,
        borderRadius: 20, padding: "48px 40px", maxWidth: 440, width: "100%",
        textAlign: "center",
      }}>
        <p style={{ color: GREEN, fontSize: 48, fontWeight: 900, marginBottom: 8 }}>404</p>
        <h1 style={{ color: TEXT, fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{t.title}</h1>
        <p style={{ color: MUTED, fontSize: 14, marginBottom: 28 }}>{t.sub}</p>

        <Link
          href="/home"
          style={{
            display: "inline-block", backgroundColor: "var(--color-primary)", color: "var(--color-primary-ink)",
            borderRadius: 10, padding: "10px 28px", fontSize: 14, fontWeight: 700,
            textDecoration: "none",
          }}
        >
          {t.home}
        </Link>
      </div>
    </div>
  );
}
