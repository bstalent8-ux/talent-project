"use client";
import { useState } from "react";
import Link from "next/link";
import { useGuestGuard } from "@/contexts/GuestGuard";
import type { LandingLang } from "./content";
import styles from "./LandingPage.module.css";

const TX = {
  ar: {
    cta: "شارك حملتك",
    signIn: "سجّل دخول عشان تشارك حملتك",
    title: "عنوان الحملة",
    titlePH: "مثلاً: إطلاق مجموعة الصيف",
    location: "المكان (اختياري)",
    file: "اختر صورة",
    submit: "إرسال",
    submitting: "جاري الإرسال...",
    sent: "تم الإرسال! هتظهر بعد موافقة الفريق.",
    error: "حصل خطأ، حاول تاني.",
    cancel: "إلغاء",
  },
  en: {
    cta: "Share your campaign",
    signIn: "Sign in to share your campaign",
    title: "Campaign title",
    titlePH: "e.g. Summer collection launch",
    location: "Location (optional)",
    file: "Choose a photo",
    submit: "Submit",
    submitting: "Submitting...",
    sent: "Sent! It'll show once the team approves it.",
    error: "Something went wrong, try again.",
    cancel: "Cancel",
  },
};

export default function BrandMomentSubmitPanel({ lang }: { lang: LandingLang }) {
  const { isGuest, loading: guardLoading } = useGuestGuard();
  const t = TX[lang];
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle");

  async function handleSubmit() {
    if (!title.trim() || !file) return;
    setStatus("submitting");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title.trim());
      formData.append("location", location.trim());
      const res = await fetch("/api/landing/brand-moments", { method: "POST", body: formData });
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
        {t.title}
        <input
          className={styles.submitPanelInput}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.titlePH}
        />
      </label>
      <label className={styles.submitPanelLabel}>
        {t.location}
        <input
          className={styles.submitPanelInput}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </label>
      <label className={styles.submitPanelLabel}>
        {t.file}
        <input
          type="file"
          accept="image/*"
          className={styles.submitPanelInput}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>
      {status === "error" && <p className={styles.submitPanelError}>{t.error}</p>}
      <div className={styles.submitPanelActions}>
        <button type="button" className={styles.submitPanelCancel} onClick={() => setOpen(false)}>{t.cancel}</button>
        <button
          type="button"
          className={styles.submitPanelSubmit}
          onClick={handleSubmit}
          disabled={status === "submitting" || !title.trim() || !file}
        >
          {status === "submitting" ? t.submitting : t.submit}
        </button>
      </div>
    </div>
  );
}
