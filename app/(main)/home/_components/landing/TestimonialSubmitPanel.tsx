"use client";
import { useState } from "react";
import Link from "next/link";
import { useGuestGuard } from "@/contexts/GuestGuard";
import type { LandingLang } from "./content";
import styles from "./LandingPage.module.css";

const TX = {
  ar: {
    cta: "شارك تجربتك",
    signIn: "سجّل دخول عشان تشارك تجربتك",
    quote: "تجربتك مع Talents",
    quotePH: "احكيلنا تجربتك باختصار...",
    role: "المسمى الوظيفي (اختياري)",
    company: "اسم الشركة (اختياري)",
    submit: "إرسال",
    submitting: "جاري الإرسال...",
    sent: "تم الإرسال! هيظهر بعد موافقة الفريق.",
    error: "حصل خطأ، حاول تاني.",
    cancel: "إلغاء",
  },
  en: {
    cta: "Share your experience",
    signIn: "Sign in to share your experience",
    quote: "Your experience with Talents",
    quotePH: "Tell us about your experience...",
    role: "Role (optional)",
    company: "Company (optional)",
    submit: "Submit",
    submitting: "Submitting...",
    sent: "Sent! It'll show once the team approves it.",
    error: "Something went wrong, try again.",
    cancel: "Cancel",
  },
};

export default function TestimonialSubmitPanel({ lang }: { lang: LandingLang }) {
  const { isGuest, loading: guardLoading } = useGuestGuard();
  const t = TX[lang];
  const [open, setOpen] = useState(false);
  const [quote, setQuote] = useState("");
  const [authorRole, setAuthorRole] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle");

  async function handleSubmit() {
    if (!quote.trim()) return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/landing/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote: quote.trim(), authorRole: authorRole.trim() || null, company: company.trim() || null }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (guardLoading) return null;

  if (status === "sent") {
    return <p className={styles.submitPanelSent}>{t.sent}</p>;
  }

  if (!open) {
    return (
      <button type="button" className={styles.submitPanelTrigger} onClick={() => setOpen(true)}>
        {t.cta}
      </button>
    );
  }

  if (isGuest) {
    return (
      <Link href="/login" className={styles.submitPanelTrigger}>
        {t.signIn}
      </Link>
    );
  }

  return (
    <div className={styles.submitPanel}>
      <label className={styles.submitPanelLabel}>
        {t.quote}
        <textarea
          className={styles.submitPanelTextarea}
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          placeholder={t.quotePH}
          rows={3}
        />
      </label>
      <div className={styles.submitPanelRow}>
        <input
          className={styles.submitPanelInput}
          value={authorRole}
          onChange={(e) => setAuthorRole(e.target.value)}
          placeholder={t.role}
        />
        <input
          className={styles.submitPanelInput}
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder={t.company}
        />
      </div>
      {status === "error" && <p className={styles.submitPanelError}>{t.error}</p>}
      <div className={styles.submitPanelActions}>
        <button type="button" className={styles.submitPanelCancel} onClick={() => setOpen(false)}>{t.cancel}</button>
        <button
          type="button"
          className={styles.submitPanelSubmit}
          onClick={handleSubmit}
          disabled={status === "submitting" || !quote.trim()}
        >
          {status === "submitting" ? t.submitting : t.submit}
        </button>
      </div>
    </div>
  );
}
