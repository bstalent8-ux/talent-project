"use client";
import { useState } from "react";
import { FileText, Calendar, CheckCircle2, XCircle } from "lucide-react";

interface Brief {
  id: string;
  title: string;
  description: string | null;
  requirements: string | null;
  attachments: string[] | null;
  deadline: string | null;
  status: "pending" | "accepted" | "rejected";
  reject_reason: string | null;
}

interface Props {
  brief: Brief;
  bookingId: string;
  myRole: "brand" | "talent";
  dark: boolean;
  lang: "ar" | "en";
  onRespond: () => void;
}

const TX = {
  ar: {
    title:      "ملخص المشروع",
    deadline:   "الموعد النهائي",
    req:        "المتطلبات",
    attach:     "المرفقات",
    accept:     "قبول الملخص",
    reject:     "رفض الملخص",
    rejectPh:   "سبب الرفض (اختياري)…",
    send:       "إرسال",
    cancel:     "إلغاء",
    pending:    "في انتظار ردك",
    accepted:   "✅ تم قبول الملخص",
    rejected:   "❌ تم رفض الملخص",
    reason:     "السبب",
    brandPending: "في انتظار رد الموهبة على الملخص…",
  },
  en: {
    title:      "Project Brief",
    deadline:   "Deadline",
    req:        "Requirements",
    attach:     "Attachments",
    accept:     "Accept Brief",
    reject:     "Reject Brief",
    rejectPh:   "Reason for rejection (optional)…",
    send:       "Send",
    cancel:     "Cancel",
    pending:    "Awaiting your response",
    accepted:   "✅ Brief Accepted",
    rejected:   "❌ Brief Rejected",
    reason:     "Reason",
    brandPending: "Waiting for talent to respond to the brief…",
  },
};

export default function BriefView({ brief, bookingId, myRole, dark, lang, onRespond }: Props) {
  const t  = TX[lang];
  const ar = lang === "ar";
  const BG     = dark ? "#0d1623" : "#ffffff";
  const BORDER = dark ? "#1e293b" : "#e2e8f0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#64748b" : "#94a3b8";
  const GREEN  = "#00D26A";
  const GOLD   = "#FFB800";

  const [showReject, setShowReject] = useState(false);
  const [reason,     setReason]     = useState("");
  const [loading,    setLoading]    = useState(false);

  async function respond(action: "accept" | "reject") {
    setLoading(true);
    await fetch(`/api/bookings/${bookingId}/brief/respond`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reject_reason: reason || null }),
    });
    setLoading(false);
    onRespond();
  }

  const statusColor = brief.status === "accepted" ? GREEN : brief.status === "rejected" ? "#ef4444" : GOLD;
  const statusLabel = brief.status === "accepted" ? t.accepted : brief.status === "rejected" ? t.rejected : (myRole === "talent" ? t.pending : t.brandPending);

  return (
    <div style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "20px 24px", fontFamily: "'Cairo',sans-serif", direction: ar ? "rtl" : "ltr" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FileText size={18} color={GREEN} />
          <h3 style={{ margin: 0, color: TEXT, fontSize: 16, fontWeight: 800 }}>{t.title}</h3>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: statusColor, padding: "3px 10px", borderRadius: 20, backgroundColor: `${statusColor}15`, border: `1px solid ${statusColor}33` }}>
          {statusLabel}
        </span>
      </div>

      <h2 style={{ color: TEXT, fontSize: 18, fontWeight: 900, margin: "0 0 10px" }}>{brief.title}</h2>

      {brief.description && (
        <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.7, margin: "0 0 14px" }}>{brief.description}</p>
      )}

      {brief.requirements && (
        <div style={{ backgroundColor: dark ? "#060d18" : "#f8fafc", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 16px", marginBottom: 14 }}>
          <p style={{ color: MUTED, fontSize: 11, fontWeight: 700, margin: "0 0 6px", textTransform: "uppercase" }}>{t.req}</p>
          <p style={{ color: TEXT, fontSize: 13, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>{brief.requirements}</p>
        </div>
      )}

      {brief.deadline && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
          <Calendar size={14} color={GOLD} />
          <span style={{ color: MUTED, fontSize: 13 }}>{t.deadline}: </span>
          <span style={{ color: TEXT, fontSize: 13, fontWeight: 700 }}>
            {new Date(brief.deadline).toLocaleDateString(ar ? "ar-EG" : "en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>
      )}

      {brief.attachments && brief.attachments.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <p style={{ color: MUTED, fontSize: 11, fontWeight: 700, margin: "0 0 6px", textTransform: "uppercase" }}>{t.attach}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {brief.attachments.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ color: GREEN, fontSize: 13, wordBreak: "break-all" }}>{url}</a>
            ))}
          </div>
        </div>
      )}

      {brief.reject_reason && (
        <div style={{ padding: "10px 14px", borderRadius: 10, backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: 14 }}>
          <p style={{ color: "#f87171", fontSize: 13, margin: 0 }}><strong>{t.reason}:</strong> {brief.reject_reason}</p>
        </div>
      )}

      {/* Talent response buttons — only when pending */}
      {myRole === "talent" && brief.status === "pending" && (
        <div style={{ marginTop: 16 }}>
          {!showReject ? (
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => respond("accept")} disabled={loading}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: GREEN, color: "#000", border: "none", borderRadius: 10, padding: "11px 0", fontSize: 14, fontWeight: 900, cursor: loading ? "default" : "pointer", fontFamily: "'Cairo',sans-serif" }}>
                <CheckCircle2 size={14} /> {t.accept}
              </button>
              <button onClick={() => setShowReject(true)} disabled={loading}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "transparent", color: "#ef4444", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 10, padding: "11px 0", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
                <XCircle size={14} /> {t.reject}
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t.rejectPh} rows={3}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, backgroundColor: dark ? "#060d18" : "#f8fafc", border: `1px solid ${BORDER}`, color: TEXT, fontSize: 13, fontFamily: "'Cairo',sans-serif", outline: "none", boxSizing: "border-box", resize: "vertical" }} />
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => respond("reject")} disabled={loading}
                  style={{ flex: 1, backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: 10, padding: "11px 0", fontSize: 13, fontWeight: 700, cursor: loading ? "default" : "pointer", fontFamily: "'Cairo',sans-serif" }}>
                  {loading ? "…" : t.send}
                </button>
                <button onClick={() => setShowReject(false)} style={{ flex: 1, backgroundColor: "transparent", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 10, padding: "11px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
                  {t.cancel}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
