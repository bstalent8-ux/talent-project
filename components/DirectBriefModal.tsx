"use client";
import { useState } from "react";

interface Props {
  talentUserId: string;
  talentName: string;
  talentAvatar?: string | null;
  talentCategory?: string | null;
  dark: boolean;
  lang: "ar" | "en";
  onClose: () => void;
  onSuccess: (bookingId: string) => void;
}

export default function DirectBriefModal({ talentUserId, talentName, talentAvatar, talentCategory, dark, lang, onClose, onSuccess }: Props) {
  const ar = lang === "ar";
  const BG     = dark ? "#0d1623" : "#ffffff";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#e2e8f0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#94a3b8" : "#64748b";
  const INPUT  = dark ? "#060d18" : "#f8fafc";
  const INBDR  = dark ? "#1e293b" : "#cbd5e1";
  const GREEN  = "#00D26A";

  const t = {
    title:    ar ? `إرسال ملخص لـ ${talentName}` : `Send Brief to ${talentName}`,
    name:     ar ? "عنوان المشروع" : "Project Title",
    namePh:   ar ? "مثال: حملة UGC لمنتج جديد" : "e.g. UGC Campaign for new product",
    desc:     ar ? "وصف المشروع" : "Project Description",
    descPh:   ar ? "اشرح المشروع بالتفصيل…" : "Describe the project in detail…",
    req:      ar ? "المتطلبات (اختياري)" : "Requirements (optional)",
    reqPh:    ar ? "عدد الفيديوهات، المدة، الأسلوب…" : "Number of videos, duration, style…",
    deadline: ar ? "الموعد النهائي (اختياري)" : "Deadline (optional)",
    send:     ar ? "إرسال الملخص" : "Send Brief",
    sending:  ar ? "جاري الإرسال…" : "Sending…",
    cancel:   ar ? "إلغاء" : "Cancel",
    required: ar ? "العنوان والوصف مطلوبان" : "Title and description are required",
    login:    ar ? "يجب تسجيل الدخول أولاً" : "Please log in first",
  };

  const [title,    setTitle]    = useState("");
  const [desc,     setDesc]     = useState("");
  const [reqs,     setReqs]     = useState("");
  const [deadline, setDeadline] = useState("");
  const [sending,  setSending]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    backgroundColor: INPUT, border: `1px solid ${INBDR}`,
    color: TEXT, fontSize: 14, fontFamily: "'Cairo',sans-serif",
    outline: "none", boxSizing: "border-box",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !desc.trim()) { setError(t.required); return; }
    setSending(true); setError(null);
    try {
      const res = await fetch("/api/bookings/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          talent_user_id: talentUserId,
          title:          title.trim(),
          description:    desc.trim(),
          requirements:   reqs.trim() || null,
          deadline:       deadline || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onSuccess(data.booking_id);
      } else {
        setError(data.error ?? "Error");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 2000, backgroundColor: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: "'Cairo',sans-serif" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ backgroundColor: BG, borderRadius: 20, width: "100%", maxWidth: 560, border: `1px solid ${BORDER}`, maxHeight: "92vh", overflowY: "auto", direction: ar ? "rtl" : "ltr" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", backgroundColor: dark ? "#1e293b" : "#e2e8f0", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: MUTED }}>
              {talentAvatar
                ? <img src={talentAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : talentName[0]}
            </div>
            <div>
              <h2 style={{ color: TEXT, fontSize: 16, fontWeight: 900, margin: 0 }}>{t.title}</h2>
              {talentCategory && <p style={{ color: MUTED, fontSize: 12, margin: "2px 0 0" }}>{talentCategory}</p>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: 20, lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", color: MUTED, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{t.name} *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.namePh} style={inputStyle} required />
          </div>
          <div>
            <label style={{ display: "block", color: MUTED, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{t.desc} *</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t.descPh} rows={4} required style={{ ...inputStyle, resize: "vertical", minHeight: 90 }} />
          </div>
          <div>
            <label style={{ display: "block", color: MUTED, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{t.req}</label>
            <textarea value={reqs} onChange={(e) => setReqs(e.target.value)} placeholder={t.reqPh} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          </div>
          <div>
            <label style={{ display: "block", color: MUTED, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{t.deadline}</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} style={inputStyle} />
          </div>

          {error && (
            <div style={{ padding: "8px 12px", borderRadius: 8, backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: 13 }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="submit" disabled={sending}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: sending ? "rgba(0,210,106,0.5)" : GREEN, color: "#000", border: "none", borderRadius: 12, padding: "12px 0", fontSize: 14, fontWeight: 900, cursor: sending ? "default" : "pointer", fontFamily: "'Cairo',sans-serif" }}>
              {sending ? t.sending : t.send}
            </button>
            <button type="button" onClick={onClose}
              style={{ flex: 1, backgroundColor: "transparent", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 12, padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
              {t.cancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
