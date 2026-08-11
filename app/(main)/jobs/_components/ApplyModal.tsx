"use client";
import { useState } from "react";
import { X, Banknote, Clock, FileText, Link as LinkIcon, Send } from "lucide-react";
import { useGuestGuard } from "@/contexts/GuestGuard";
import { canApplyJob } from "@/lib/permissions";
import type { JobPost } from "../page";
import styles from "./JobsPage.module.css";

interface Props {
  job: JobPost;
  dark?: boolean;
  lang: "ar" | "en";
  onClose: () => void;
  onSuccess: () => void;
}

const TX = {
  ar: {
    title:       "قدّم عرضك",
    subtitle:    "أرسل عرضك الاحترافي للبراند",
    price:       "السعر المقترح (EGP)",
    pricePh:     "مثال: 3500",
    days:        "مدة التسليم (أيام)",
    daysPh:      "مثال: 5",
    message:     "رسالة العرض",
    messagePh:   "اشرح ما ستقدمه بالتفصيل…",
    portfolio:   "روابط أعمال سابقة (اختياري)",
    portfolioPh: "https://... (رابط واحد لكل سطر)",
    submit:      "أرسل العرض",
    cancel:      "إلغاء",
    sending:     "جارٍ الإرسال…",
    required:    "يرجى تعبئة السعر والرسالة على الأقل",
    budget:      "الميزانية المعلنة",
    negotiable:  "يُتفق عليه",
  },
  en: {
    title:       "Submit your proposal",
    subtitle:    "Send a professional offer to the brand",
    price:       "Proposed price (EGP)",
    pricePh:     "e.g. 3500",
    days:        "Delivery time (days)",
    daysPh:      "e.g. 5",
    message:     "Proposal message",
    messagePh:   "Describe exactly what you'll deliver…",
    portfolio:   "Portfolio links (optional)",
    portfolioPh: "https://... (one link per line)",
    submit:      "Send proposal",
    cancel:      "Cancel",
    sending:     "Sending…",
    required:    "Please fill in price and message at minimum",
    budget:      "Posted budget",
    negotiable:  "Negotiable",
  },
};

export default function ApplyModal({ job, lang, onClose, onSuccess }: Props) {
  const t  = TX[lang];
  const ar = lang === "ar";
  const { user, requestAuth } = useGuestGuard();
  const [price,     setPrice]     = useState("");
  const [days,      setDays]      = useState("");
  const [message,   setMessage]   = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [sending,   setSending]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  function fmtBudget() {
    if (!job.budget_min && !job.budget_max) return t.negotiable;
    if (job.budget_min && job.budget_max && job.budget_min !== job.budget_max)
      return `${job.budget_min.toLocaleString()} – ${job.budget_max.toLocaleString()} ${job.currency}`;
    return `${(job.budget_max ?? job.budget_min)!.toLocaleString()} ${job.currency}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canApplyJob(user).allowed) {
      onClose();
      requestAuth("apply_job");
      return;
    }

    if (!price || !message.trim()) { setError(t.required); return; }

    setSending(true);
    setError(null);
    try {
      const portfolioLinks = portfolio
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.startsWith("http"));

      const res = await fetch(`/api/jobs/${job.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposed_price:  Number(price),
          delivery_days:   days ? Number(days) : null,
          message:         message.trim(),
          portfolio_links: portfolioLinks.length ? portfolioLinks : null,
        }),
      });

      const data = await res.json();
      if (res.ok || data.already_applied) {
        onSuccess();
      } else {
        setError(data.error ?? "Error");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className={`${styles.modalBackdrop} ${ar ? styles.rtl : styles.ltr}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={styles.modalCard}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>{t.title}</h2>
            <p className={styles.modalSubtitle}>{job.title}</p>
          </div>
          <button type="button" onClick={onClose} className={styles.modalClose} aria-label="close">
            <X size={20} />
          </button>
        </div>

        {/* Budget hint */}
        <div className={styles.modalBudgetHint}>
          <Banknote size={13} />
          <span>{t.budget}: {fmtBudget()}</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formRow}>
            <div>
              <label className={styles.fieldLabel}><Banknote size={12} /> {t.price}</label>
              <input
                type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)}
                placeholder={t.pricePh} className={styles.fieldInput} required
              />
            </div>
            <div>
              <label className={styles.fieldLabel}><Clock size={12} /> {t.days}</label>
              <input
                type="number" min={1} value={days} onChange={(e) => setDays(e.target.value)}
                placeholder={t.daysPh} className={styles.fieldInput}
              />
            </div>
          </div>

          <div>
            <label className={styles.fieldLabel}><FileText size={12} /> {t.message}</label>
            <textarea
              value={message} onChange={(e) => setMessage(e.target.value)}
              placeholder={t.messagePh} rows={5} required
              className={styles.fieldTextarea}
            />
          </div>

          <div>
            <label className={styles.fieldLabel}><LinkIcon size={12} /> {t.portfolio}</label>
            <textarea
              value={portfolio} onChange={(e) => setPortfolio(e.target.value)}
              placeholder={t.portfolioPh} rows={2}
              className={styles.fieldTextarea}
            />
          </div>

          {error && <div className={styles.formError}>{error}</div>}

          <div className={styles.formActions}>
            <button type="submit" disabled={sending} className={styles.submitBtn}>
              <Send size={14} />
              {sending ? t.sending : t.submit}
            </button>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>
              {t.cancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
