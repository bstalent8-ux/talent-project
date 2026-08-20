"use client";

// ─── Quick support ticket (register / login pages) ────────────────────────
// For a visitor who literally cannot sign in — the whole reason this exists
// on these two pages instead of only the full /contact form. Auto-captures
// which page and what error was on screen so the admin doesn't have to ask;
// the visitor only types email + message. Public, no auth required — see
// app/api/support/tickets/route.ts.

import { useState } from "react";
import { X } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import styles from "./SupportTicketModal.module.css";

const TX = {
  ar: {
    trigger:  "محتاج مساعدة؟",
    heading:  "محتاج مساعدة؟",
    sub:      "ابعتلنا المشكلة وهنتواصل معاك في أقرب وقت.",
    email:    "البريد الإلكتروني",
    emailPH:  "example@email.com",
    phone:    "رقم الهاتف (اختياري)",
    phonePH:  "+20 1xx xxx xxxx",
    message:  "المشكلة",
    messagePH: "قولنا اللي حصل بالظبط...",
    submit:   "إرسال",
    sending:  "جاري الإرسال...",
    errRequired: "الإيميل والرسالة مطلوبين.",
    errEmail:    "أدخل بريد إلكتروني صحيح.",
    errServer:   "حصل خطأ، حاول تاني.",
    successTitle: "تم الإرسال ✓",
    successSub:   "هنتواصل معاك على الإيميل قريب.",
    close: "إغلاق",
  },
  en: {
    trigger:  "Need help?",
    heading:  "Need help?",
    sub:      "Tell us what went wrong and we'll get back to you soon.",
    email:    "Email address",
    emailPH:  "example@email.com",
    phone:    "Phone number (optional)",
    phonePH:  "+20 1xx xxx xxxx",
    message:  "What happened",
    messagePH: "Tell us exactly what happened...",
    submit:   "Send",
    sending:  "Sending...",
    errRequired: "Email and message are required.",
    errEmail:    "Enter a valid email address.",
    errServer:   "Something went wrong, try again.",
    successTitle: "Sent ✓",
    successSub:   "We'll reach out to your email soon.",
    close: "Close",
  },
};

export default function SupportTicketModal({ page, pageError }: { page: "register" | "login"; pageError?: string | null }) {
  const { lang } = useSite();
  const t = TX[lang];

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  function reset() {
    setOpen(false);
    setEmail(""); setPhone(""); setMessage(""); setError(""); setSent(false);
  }

  async function submit() {
    if (!email.trim() || !message.trim()) { setError(t.errRequired); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError(t.errEmail); return; }

    setSending(true); setError("");
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), phone: phone.trim(), message: message.trim(), page, pageError: pageError ?? null }),
      });
      if (!res.ok) { setError(t.errServer); setSending(false); return; }
      setSent(true);
    } catch {
      setError(t.errServer);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button type="button" className={styles.trigger} onClick={() => setOpen(true)}>
        {t.trigger}
      </button>

      {open && (
        <div className={styles.backdrop} onClick={reset}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.closeBtn} onClick={reset} aria-label={t.close}>
              <X size={18} />
            </button>

            {sent ? (
              <div className={styles.successState}>
                <p className={styles.heading}>{t.successTitle}</p>
                <p className={styles.sub}>{t.successSub}</p>
              </div>
            ) : (
              <>
                <p className={styles.heading}>{t.heading}</p>
                <p className={styles.sub}>{t.sub}</p>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="ticket-email">{t.email}</label>
                  <input
                    id="ticket-email"
                    className={styles.input}
                    type="email"
                    placeholder={t.emailPH}
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="ticket-phone">{t.phone}</label>
                  <input
                    id="ticket-phone"
                    className={styles.input}
                    type="tel"
                    placeholder={t.phonePH}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="ticket-message">{t.message}</label>
                  <textarea
                    id="ticket-message"
                    className={styles.textarea}
                    rows={3}
                    placeholder={t.messagePH}
                    value={message}
                    onChange={(e) => { setMessage(e.target.value); setError(""); }}
                  />
                </div>

                {error && <p className={styles.errorText} role="alert">{error}</p>}

                <button type="button" className={styles.submit} onClick={submit} disabled={sending}>
                  {sending ? t.sending : t.submit}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
