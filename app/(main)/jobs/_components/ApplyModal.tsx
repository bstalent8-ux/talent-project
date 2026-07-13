"use client";
import { useState } from "react";
import { X, Banknote, Clock, FileText, Link as LinkIcon, Send } from "lucide-react";
import type { JobPost } from "../page";

interface Props {
  job: JobPost;
  dark: boolean;
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
    success:     "تم إرسال عرضك بنجاح ✓",
    required:    "يرجى تعبئة السعر والرسالة على الأقل",
    budget:      "الميزانية المعلنة",
    negotiable:  "يُتفق عليه",
  },
  en: {
    title:       "Submit Your Proposal",
    subtitle:    "Send a professional offer to the brand",
    price:       "Proposed Price (EGP)",
    pricePh:     "e.g. 3500",
    days:        "Delivery Time (days)",
    daysPh:      "e.g. 5",
    message:     "Proposal Message",
    messagePh:   "Describe exactly what you'll deliver…",
    portfolio:   "Portfolio Links (optional)",
    portfolioPh: "https://... (one link per line)",
    submit:      "Send Proposal",
    cancel:      "Cancel",
    sending:     "Sending…",
    success:     "Proposal submitted ✓",
    required:    "Please fill in price and message at minimum",
    budget:      "Posted budget",
    negotiable:  "Negotiable",
  },
};

export default function ApplyModal({ job, dark, lang, onClose, onSuccess }: Props) {
  const t  = TX[lang];
  const ar = lang === "ar";
  const GREEN  = "#00D26A";
  const GOLD   = "#FFB800";
  const BG     = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const TEXT   = dark ? "#F1F5F9" : "#0F172A";
  const MUTED  = dark ? "#A8B3C2" : "#64748B";
  const INPUT  = dark ? "#060d18" : "#F8FAFC";
  const INBDR  = dark ? "#1e293b" : "#CBD5E1";
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

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    backgroundColor: INPUT, border: `1px solid ${INBDR}`,
    color: TEXT, fontSize: 14, fontFamily: "'Cairo',sans-serif",
    outline: "none", boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 6,
    color: MUTED, fontSize: 12, fontWeight: 700, marginBottom: 6,
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      backgroundColor: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, fontFamily: "'Cairo',sans-serif",
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        backgroundColor: BG, borderRadius: 20, width: "100%", maxWidth: 560,
        border: `1px solid ${BORDER}`, maxHeight: "92vh", overflowY: "auto",
        direction: ar ? "rtl" : "ltr",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ color: TEXT, fontSize: 18, fontWeight: 900, margin: 0 }}>{t.title}</h2>
            <p style={{ color: MUTED, fontSize: 12, margin: "4px 0 0" }}>{job.title}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Budget hint */}
        <div style={{ margin: "12px 24px 0", padding: "8px 12px", borderRadius: 10, backgroundColor: dark ? "rgba(255,184,0,0.06)" : "rgba(255,184,0,0.05)", border: "1px solid rgba(255,184,0,0.2)", display: "flex", alignItems: "center", gap: 6 }}>
          <Banknote size={13} color={GOLD} />
          <span style={{ color: GOLD, fontSize: 12, fontWeight: 700 }}>{t.budget}: {fmtBudget()}</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Price + Days row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}><Banknote size={12} color={GREEN} /> {t.price}</label>
              <input
                type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)}
                placeholder={t.pricePh} style={inputStyle} required
              />
            </div>
            <div>
              <label style={labelStyle}><Clock size={12} color={GREEN} /> {t.days}</label>
              <input
                type="number" min={1} value={days} onChange={(e) => setDays(e.target.value)}
                placeholder={t.daysPh} style={inputStyle}
              />
            </div>
          </div>

          {/* Message */}
          <div>
            <label style={labelStyle}><FileText size={12} color={GREEN} /> {t.message}</label>
            <textarea
              value={message} onChange={(e) => setMessage(e.target.value)}
              placeholder={t.messagePh} rows={5} required
              style={{ ...inputStyle, resize: "vertical", minHeight: 100 }}
            />
          </div>

          {/* Portfolio */}
          <div>
            <label style={labelStyle}><LinkIcon size={12} color={MUTED} /> {t.portfolio}</label>
            <textarea
              value={portfolio} onChange={(e) => setPortfolio(e.target.value)}
              placeholder={t.portfolioPh} rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding: "8px 12px", borderRadius: 8, backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: 12 }}>
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button
              type="submit" disabled={sending}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                backgroundColor: sending ? "rgba(0,210,106,0.5)" : GREEN,
                color: "#000", border: "none", borderRadius: 12, padding: "12px 0",
                fontSize: 14, fontWeight: 900, cursor: sending ? "default" : "pointer",
                fontFamily: "'Cairo',sans-serif",
              }}
            >
              <Send size={14} />
              {sending ? t.sending : t.submit}
            </button>
            <button
              type="button" onClick={onClose}
              style={{
                flex: 1, backgroundColor: "transparent", border: `1px solid ${BORDER}`,
                color: MUTED, borderRadius: 12, padding: "12px 0",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
                fontFamily: "'Cairo',sans-serif",
              }}
            >
              {t.cancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
