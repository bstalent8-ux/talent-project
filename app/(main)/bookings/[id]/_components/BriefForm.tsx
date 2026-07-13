"use client";
import { useState } from "react";
import { X, FileText, Calendar, Send } from "lucide-react";

interface Props {
  bookingId: string;
  dark: boolean;
  lang: "ar" | "en";
  onClose: () => void;
  onSuccess: () => void;
}

const TX = {
  ar: {
    title:      "إرسال ملخص المشروع",
    name:       "اسم المشروع / العنوان",
    namePh:     "مثال: حملة إعلانية لمنتج X",
    desc:       "وصف المشروع",
    descPh:     "اشرح المشروع بالتفصيل…",
    req:        "المتطلبات والتفاصيل التقنية",
    reqPh:      "عدد الفيديوهات، المدة، التنسيق، الأسلوب…",
    attach:     "روابط مرفقات (اختياري)",
    attachPh:   "https://... رابط واحد في كل سطر",
    deadline:   "الموعد النهائي",
    send:       "إرسال الملخص",
    cancel:     "إلغاء",
    sending:    "جاري الإرسال…",
    required:   "يرجى تعبئة العنوان والوصف",
  },
  en: {
    title:      "Send Project Brief",
    name:       "Project Title",
    namePh:     "e.g. UGC Campaign for Product X",
    desc:       "Project Description",
    descPh:     "Describe the project in detail…",
    req:        "Requirements & Technical Details",
    reqPh:      "Number of videos, duration, format, style…",
    attach:     "Attachment Links (optional)",
    attachPh:   "https://... one per line",
    deadline:   "Deadline",
    send:       "Send Brief",
    cancel:     "Cancel",
    sending:    "Sending…",
    required:   "Title and description are required",
  },
};

export default function BriefForm({ bookingId, dark, lang, onClose, onSuccess }: Props) {
  const t  = TX[lang];
  const ar = lang === "ar";
  const BG     = dark ? "#0d1623" : "#ffffff";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#e2e8f0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#94a3b8" : "#64748b";
  const INPUT  = dark ? "#060d18" : "#f8fafc";
  const INBDR  = dark ? "#1e293b" : "#cbd5e1";
  const GREEN  = "#00D26A";

  const [title,    setTitle]    = useState("");
  const [desc,     setDesc]     = useState("");
  const [reqs,     setReqs]     = useState("");
  const [attach,   setAttach]   = useState("");
  const [deadline, setDeadline] = useState("");
  const [sending,  setSending]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !desc.trim()) { setError(t.required); return; }
    setSending(true); setError(null);
    try {
      const attachments = attach.split("\n").map((l) => l.trim()).filter((l) => l.startsWith("http"));
      const res = await fetch(`/api/bookings/${bookingId}/brief`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: desc.trim(), requirements: reqs.trim() || null, attachments: attachments.length ? attachments : null, deadline: deadline || null }),
      });
      const data = await res.json();
      if (res.ok) onSuccess();
      else setError(data.error ?? "Error");
    } finally { setSending(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: "'Cairo',sans-serif" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ backgroundColor: BG, borderRadius: 20, width: "100%", maxWidth: 580, border: `1px solid ${BORDER}`, maxHeight: "92vh", overflowY: "auto", direction: ar ? "rtl" : "ltr" }}>
        <div style={{ padding: "20px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FileText size={20} color={GREEN} />
            <h2 style={{ color: TEXT, fontSize: 18, fontWeight: 900, margin: 0 }}>{t.title}</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, padding: 4 }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>{t.name}</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.namePh} style={inputStyle} required />
          </div>

          <div>
            <label style={labelStyle}>{t.desc}</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t.descPh} rows={4} required style={{ ...inputStyle, resize: "vertical", minHeight: 90 }} />
          </div>

          <div>
            <label style={labelStyle}>{t.req}</label>
            <textarea value={reqs} onChange={(e) => setReqs(e.target.value)} placeholder={t.reqPh} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}><Calendar size={12} color={MUTED} /> {t.deadline}</label>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t.attach}</label>
              <textarea value={attach} onChange={(e) => setAttach(e.target.value)} placeholder={t.attachPh} rows={2} style={{ ...inputStyle, resize: "none" }} />
            </div>
          </div>

          {error && <div style={{ padding: "8px 12px", borderRadius: 8, backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: 12 }}>{error}</div>}

          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" disabled={sending} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: sending ? "rgba(0,210,106,0.5)" : GREEN, color: "#000", border: "none", borderRadius: 12, padding: "12px 0", fontSize: 14, fontWeight: 900, cursor: sending ? "default" : "pointer", fontFamily: "'Cairo',sans-serif" }}>
              <Send size={14} /> {sending ? t.sending : t.send}
            </button>
            <button type="button" onClick={onClose} style={{ flex: 1, backgroundColor: "transparent", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 12, padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
              {t.cancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
