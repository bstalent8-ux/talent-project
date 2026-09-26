"use client";
import Link from "next/link";
import { Mail } from "lucide-react";
import SupportTicketModal from "@/components/support/SupportTicketModal";
import type { SectionProps } from "./SettingsClient";

const TX = {
  ar: {
    title: "الدعم",
    contactDesc: "لأي استفسار عام، تواصل معنا من صفحة التواصل.",
    contactBtn: "تواصل معنا",
    reportDesc: "واجهت مشكلة في حسابك؟ ابعتلنا التفاصيل وهنساعدك.",
  },
  en: {
    title: "Support",
    contactDesc: "For general inquiries, reach us through the contact page.",
    contactBtn: "Contact Us",
    reportDesc: "Ran into a problem with your account? Send us the details and we'll help.",
  },
};

export default function SupportSection({ lang, dark }: SectionProps) {
  const t = TX[lang];
  const TEXT   = dark ? "#F5EEDB" : "#2B211D";
  const MUTED  = dark ? "#A99B8E" : "#6E5F55";
  const BORDER = dark ? "rgba(79,167,163,0.15)" : "#E6DCC3";
  const SURFACE = dark ? "#231A16" : "#F6F0DD";
  const GREEN  = "var(--color-primary-text)";

  return (
    <div>
      <h2 style={{ color: TEXT, fontSize: 17, fontWeight: 800, margin: "0 0 20px" }}>{t.title}</h2>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: 16, backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, marginBottom: 14 }}>
        <Mail size={18} color={GREEN} style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1 }}>
          <p style={{ color: MUTED, fontSize: 12.5, margin: "0 0 10px" }}>{t.contactDesc}</p>
          <Link href="/contact" style={{ display: "inline-flex", padding: "8px 18px", backgroundColor: "var(--color-primary)", borderRadius: 8, color: "var(--color-primary-ink)", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>
            {t.contactBtn}
          </Link>
        </div>
      </div>

      <div style={{ padding: 16, backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12 }}>
        <p style={{ color: MUTED, fontSize: 12.5, margin: "0 0 12px" }}>{t.reportDesc}</p>
        <SupportTicketModal page="settings" />
      </div>
    </div>
  );
}
