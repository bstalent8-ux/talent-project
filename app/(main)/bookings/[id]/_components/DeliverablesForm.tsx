"use client";
import { useState } from "react";
import { Upload, Link as LinkIcon, Send, X, CheckCircle2, Clock } from "lucide-react";

interface Deliverable {
  id: string;
  files: string[] | null;
  links: string[] | null;
  notes: string | null;
  status: "submitted" | "approved" | "revision_requested";
  feedback: string | null;
  created_at: string;
}

interface Props {
  bookingId: string;
  deliverables: Deliverable[];
  myRole: "brand" | "talent";
  bookingStatus: string;
  dark: boolean;
  lang: "ar" | "en";
  onUpdate: () => void;
}

const TX = {
  ar: {
    title:     "تسليم الأعمال",
    links:     "روابط الأعمال (رابط واحد لكل سطر)",
    linksPh:   "https://drive.google.com/...",
    notes:     "ملاحظات",
    notesPh:   "أي تفاصيل إضافية عن التسليم…",
    submit:    "تسليم الأعمال",
    sending:   "جاري الإرسال…",
    required:  "أدخل رابطاً واحداً على الأقل",
    delivered: "تم التسليم",
    waiting:   "في انتظار مراجعة البراند",
    approved:  "✅ تمت الموافقة وإطلاق الدفع",
    revision:  "🔄 مطلوب تعديل",
    feedback:  "ملاحظات البراند",
    approve:   "موافقة وإطلاق الدفع",
    askRevision: "طلب تعديل",
    revPh:     "وصف التعديل المطلوب…",
    send:      "إرسال",
    cancel:    "إلغاء",
  },
  en: {
    title:     "Submit Deliverables",
    links:     "Work Links (one per line)",
    linksPh:   "https://drive.google.com/...",
    notes:     "Notes",
    notesPh:   "Any additional details about the delivery…",
    submit:    "Submit Deliverables",
    sending:   "Submitting…",
    required:  "Provide at least one link",
    delivered: "Submitted",
    waiting:   "Waiting for brand review",
    approved:  "✅ Approved & Payment Released",
    revision:  "🔄 Revision Requested",
    feedback:  "Brand Feedback",
    approve:   "Approve & Release Payment",
    askRevision: "Request Revision",
    revPh:     "Describe what needs to be changed…",
    send:      "Send",
    cancel:    "Cancel",
  },
};

export default function DeliverablesForm({ bookingId, deliverables, myRole, bookingStatus, dark, lang, onUpdate }: Props) {
  const t  = TX[lang];
  const ar = lang === "ar";
  const BG     = dark ? "#0d1623" : "#ffffff";
  const BORDER = dark ? "#1e293b" : "#e2e8f0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#64748b" : "#94a3b8";
  const INPUT  = dark ? "#060d18" : "#f8fafc";
  const GREEN  = "#00D26A";
  const GOLD   = "#FFB800";

  const [links,   setLinks]   = useState("");
  const [notes,   setNotes]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [revMode, setRevMode] = useState<string | null>(null);
  const [revNote, setRevNote] = useState("");

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    backgroundColor: INPUT, border: `1px solid ${BORDER}`,
    color: TEXT, fontSize: 13, fontFamily: "'Cairo',sans-serif",
    outline: "none", boxSizing: "border-box",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = links.split("\n").map((l) => l.trim()).filter((l) => l.startsWith("http"));
    if (!parsed.length) { setError(t.required); return; }
    setLoading(true); setError(null);
    const res = await fetch(`/api/bookings/${bookingId}/deliverables`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ links: parsed, notes: notes.trim() || null }),
    });
    setLoading(false);
    if (res.ok) { setLinks(""); setNotes(""); onUpdate(); }
    else { const d = await res.json(); setError(d.error ?? "Error"); }
  }

  async function handleApprove(delId: string) {
    setLoading(true);
    await fetch(`/api/bookings/${bookingId}/deliverables`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve", deliverable_id: delId }),
    });
    setLoading(false); onUpdate();
  }

  async function handleRevision(delId: string) {
    setLoading(true);
    await fetch(`/api/bookings/${bookingId}/deliverables`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revision", deliverable_id: delId, feedback: revNote }),
    });
    setLoading(false); setRevMode(null); setRevNote(""); onUpdate();
  }

  const statusMap: Record<string, { label: string; color: string }> = {
    submitted:          { label: ar ? t.waiting   : t.waiting,   color: GOLD   },
    approved:           { label: ar ? t.approved  : t.approved,  color: GREEN  },
    revision_requested: { label: ar ? t.revision  : t.revision,  color: "#f59e0b" },
  };

  return (
    <div style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "20px 24px", fontFamily: "'Cairo',sans-serif", direction: ar ? "rtl" : "ltr" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <Upload size={18} color={GREEN} />
        <h3 style={{ margin: 0, color: TEXT, fontSize: 16, fontWeight: 800 }}>{t.title}</h3>
      </div>

      {/* Existing submissions */}
      {deliverables.map((d) => {
        const st = statusMap[d.status] ?? { label: d.status, color: MUTED };
        return (
          <div key={d.id} style={{ backgroundColor: dark ? "#060d18" : "#f8fafc", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: MUTED }}>{new Date(d.created_at).toLocaleDateString(ar ? "ar-EG" : "en-GB")}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: st.color, padding: "2px 8px", borderRadius: 20, backgroundColor: `${st.color}15` }}>{st.label}</span>
            </div>
            {(d.links ?? []).map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, color: GREEN, fontSize: 13, marginBottom: 4 }}>
                <LinkIcon size={12} /> {url}
              </a>
            ))}
            {d.notes && <p style={{ color: MUTED, fontSize: 12, margin: "6px 0 0" }}>{d.notes}</p>}
            {d.feedback && (
              <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, backgroundColor: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <p style={{ color: "#f59e0b", fontSize: 12, margin: 0 }}><strong>{t.feedback}:</strong> {d.feedback}</p>
              </div>
            )}

            {/* Brand actions on submitted deliverable */}
            {myRole === "brand" && d.status === "submitted" && (
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button onClick={() => handleApprove(d.id)} disabled={loading}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: GREEN, color: "#000", border: "none", borderRadius: 8, padding: "9px 0", fontSize: 12, fontWeight: 900, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
                  <CheckCircle2 size={13} /> {t.approve}
                </button>
                {revMode !== d.id ? (
                  <button onClick={() => setRevMode(d.id)} disabled={loading}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "transparent", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.4)", borderRadius: 8, padding: "9px 0", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
                    <Clock size={13} /> {t.askRevision}
                  </button>
                ) : (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    <textarea value={revNote} onChange={(e) => setRevNote(e.target.value)} placeholder={t.revPh} rows={2}
                      style={{ ...inputStyle, resize: "none", fontSize: 12 }} />
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => handleRevision(d.id)} disabled={loading} style={{ flex: 1, backgroundColor: "#f59e0b", color: "#000", border: "none", borderRadius: 6, padding: "7px 0", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>{t.send}</button>
                      <button onClick={() => setRevMode(null)} style={{ flex: 1, backgroundColor: "transparent", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 6, padding: "7px 0", fontSize: 12, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>{t.cancel}</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Submit form for talent */}
      {myRole === "talent" && bookingStatus === "in_progress" && (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: deliverables.length ? 12 : 0 }}>
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: 6, color: MUTED, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              <LinkIcon size={12} color={GREEN} /> {t.links}
            </label>
            <textarea value={links} onChange={(e) => setLinks(e.target.value)} placeholder={t.linksPh} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          </div>
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: 6, color: MUTED, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              {t.notes}
            </label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t.notesPh} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
          </div>
          {error && <p style={{ color: "#f87171", fontSize: 12, margin: 0 }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: loading ? "rgba(0,210,106,0.5)" : GREEN, color: "#000", border: "none", borderRadius: 10, padding: "12px 0", fontSize: 14, fontWeight: 900, cursor: loading ? "default" : "pointer", fontFamily: "'Cairo',sans-serif" }}>
            <Send size={14} /> {loading ? t.sending : t.submit}
          </button>
        </form>
      )}

      {myRole === "talent" && bookingStatus === "completed" && !deliverables.some(d => d.status === "submitted") && (
        <p style={{ color: MUTED, fontSize: 13, textAlign: "center", margin: 0 }}>
          <Clock size={14} style={{ verticalAlign: "middle" }} /> {t.waiting}
        </p>
      )}
    </div>
  );
}
