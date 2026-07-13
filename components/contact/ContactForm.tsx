"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useSite } from "@/contexts/SiteContext";

const TX = {
  ar: {
    name:        "الاسم الكامل",
    email:       "البريد الإلكتروني",
    type:        "أنت",
    typeBrand:   "شركة / براند",
    typeTalent:  "موهبة / مستقل",
    typeOther:   "أخرى",
    subject:     "الموضوع",
    message:     "رسالتك",
    messagePH:   "اكتب رسالتك هنا...",
    send:        "إرسال الرسالة",
    sending:     "جاري الإرسال...",
    success:     "تم إرسال رسالتك! سنرد عليك في أقرب وقت.",
    error:       "حدث خطأ، يرجى المحاولة مرة أخرى.",
    required:    "هذا الحقل مطلوب",
  },
  en: {
    name:        "Full Name",
    email:       "Email Address",
    type:        "You are",
    typeBrand:   "Brand / Company",
    typeTalent:  "Talent / Freelancer",
    typeOther:   "Other",
    subject:     "Subject",
    message:     "Your Message",
    messagePH:   "Write your message here...",
    send:        "Send Message",
    sending:     "Sending...",
    success:     "Message sent! We'll get back to you soon.",
    error:       "Something went wrong. Please try again.",
    required:    "This field is required",
  },
};

export default function ContactForm() {
  const { lang, dark } = useSite();
  const t  = TX[lang];
  const ar = lang === "ar";

  const [form, setForm]     = useState({ name: "", email: "", type: "other", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const BORDER = dark ? "rgba(255,255,255,0.1)" : "#e2e8f0";
  const CARD   = dark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#64748b" : "#94a3b8";
  const INPUT  = dark ? "rgba(255,255,255,0.06)" : "#f8fafc";
  const GREEN  = "#00D26A";

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim())    e.name    = t.required;
    if (!form.email.trim())   e.email   = t.required;
    if (!form.subject.trim()) e.subject = t.required;
    if (!form.message.trim()) e.message = t.required;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("success");
      setForm({ name: "", email: "", type: "other", subject: "", message: "" });
    } catch {
      setStatus("error");
    }
  }

  const inputStyle: React.CSSProperties = {
    width:        "100%",
    padding:      "12px 16px",
    background:   INPUT,
    border:       `1px solid ${BORDER}`,
    borderRadius: 10,
    color:        TEXT,
    fontSize:     14,
    fontFamily:   "'Cairo', sans-serif",
    outline:      "none",
    boxSizing:    "border-box",
    transition:   "border-color 0.15s",
  };

  const labelStyle: React.CSSProperties = {
    display:    "block",
    color:      MUTED,
    fontSize:   12,
    fontWeight: 600,
    marginBottom: 6,
    fontFamily: "'Cairo', sans-serif",
    letterSpacing: 0.5,
  };

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background:   dark ? "rgba(0,210,106,0.08)" : "rgba(0,210,106,0.06)",
          border:       "1px solid rgba(0,210,106,0.3)",
          borderRadius: 16, padding: "40px 32px",
          textAlign:    "center", fontFamily: "'Cairo', sans-serif",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <p style={{ color: GREEN, fontSize: 16, fontWeight: 700, margin: 0 }}>{t.success}</p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} dir={ar ? "rtl" : "ltr"} style={{
      background: CARD, border: `1px solid ${BORDER}`,
      borderRadius: 20, padding: "32px",
      display: "flex", flexDirection: "column", gap: 20,
    }}>

      {/* Name + Email row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={labelStyle}>{t.name}</label>
          <input
            style={{ ...inputStyle, borderColor: errors.name ? "#ef4444" : BORDER }}
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            onFocus={e => (e.target.style.borderColor = GREEN)}
            onBlur={e => (e.target.style.borderColor = errors.name ? "#ef4444" : BORDER)}
          />
          {errors.name && <p style={{ color: "#ef4444", fontSize: 11, margin: "4px 0 0", fontFamily: "'Cairo', sans-serif" }}>{errors.name}</p>}
        </div>
        <div>
          <label style={labelStyle}>{t.email}</label>
          <input
            type="email"
            style={{ ...inputStyle, borderColor: errors.email ? "#ef4444" : BORDER }}
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            onFocus={e => (e.target.style.borderColor = GREEN)}
            onBlur={e => (e.target.style.borderColor = errors.email ? "#ef4444" : BORDER)}
          />
          {errors.email && <p style={{ color: "#ef4444", fontSize: 11, margin: "4px 0 0", fontFamily: "'Cairo', sans-serif" }}>{errors.email}</p>}
        </div>
      </div>

      {/* Type selector */}
      <div>
        <label style={labelStyle}>{t.type}</label>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {(["brand", "talent", "other"] as const).map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => setForm(f => ({ ...f, type: opt }))}
              style={{
                padding:      "8px 20px",
                borderRadius: 20,
                border:       `1px solid ${form.type === opt ? GREEN : BORDER}`,
                background:   form.type === opt ? `rgba(0,210,106,0.12)` : INPUT,
                color:        form.type === opt ? GREEN : MUTED,
                fontSize:     13,
                fontWeight:   form.type === opt ? 700 : 400,
                cursor:       "pointer",
                fontFamily:   "'Cairo', sans-serif",
                transition:   "all 0.15s",
              }}
            >
              {opt === "brand" ? t.typeBrand : opt === "talent" ? t.typeTalent : t.typeOther}
            </button>
          ))}
        </div>
      </div>

      {/* Subject */}
      <div>
        <label style={labelStyle}>{t.subject}</label>
        <input
          style={{ ...inputStyle, borderColor: errors.subject ? "#ef4444" : BORDER }}
          value={form.subject}
          onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
          onFocus={e => (e.target.style.borderColor = GREEN)}
          onBlur={e => (e.target.style.borderColor = errors.subject ? "#ef4444" : BORDER)}
        />
        {errors.subject && <p style={{ color: "#ef4444", fontSize: 11, margin: "4px 0 0", fontFamily: "'Cairo', sans-serif" }}>{errors.subject}</p>}
      </div>

      {/* Message */}
      <div>
        <label style={labelStyle}>{t.message}</label>
        <textarea
          rows={5}
          placeholder={t.messagePH}
          style={{ ...inputStyle, resize: "vertical", borderColor: errors.message ? "#ef4444" : BORDER }}
          value={form.message}
          onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          onFocus={e => (e.target.style.borderColor = GREEN)}
          onBlur={e => (e.target.style.borderColor = errors.message ? "#ef4444" : BORDER)}
        />
        {errors.message && <p style={{ color: "#ef4444", fontSize: 11, margin: "4px 0 0", fontFamily: "'Cairo', sans-serif" }}>{errors.message}</p>}
      </div>

      {status === "error" && (
        <p style={{ color: "#ef4444", fontSize: 13, fontFamily: "'Cairo', sans-serif", margin: 0 }}>{t.error}</p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        style={{
          padding:      "14px 32px",
          borderRadius: 12,
          border:       "none",
          background:   status === "sending" ? MUTED : `linear-gradient(135deg, #00D26A, #00C9B1)`,
          color:        "#fff",
          fontSize:     15,
          fontWeight:   700,
          fontFamily:   "'Cairo', sans-serif",
          cursor:       status === "sending" ? "not-allowed" : "pointer",
          transition:   "transform 0.2s, box-shadow 0.2s",
          boxShadow:    "0 4px 16px rgba(0,210,106,0.3)",
        }}
        onMouseEnter={e => {
          if (status !== "sending") {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(0,210,106,0.4)";
          }
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(0,210,106,0.3)";
        }}
      >
        {status === "sending" ? t.sending : t.send}
      </button>
    </form>
  );
}
