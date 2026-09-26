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
  status: "pending" | "accepted" | "rejected" | "changes_requested";
  reject_reason: string | null;
}

interface Props {
  brief: Brief;
  bookingId: string;
  bookingStatus: string;
  myRole: "brand" | "talent";
  dark: boolean;
  lang: "ar" | "en";
  onRespond: () => void;
  // Flow 2 price negotiation — see supabase/migrations/20260914_booking_negotiation.sql
  // and /api/bookings/[id]/brief/respond's propose_price/accept_price actions.
  budgetMin?: number | null;
  budgetMax?: number | null;
  proposedAmount?: number | null;
  proposedBy?: "brand" | "talent" | null;
  brandPriceAck?: boolean;
  talentPriceAck?: boolean;
  amount?: number | null;
}

const TX = {
  ar: {
    title:      "ملخص المشروع",
    deadline:   "الموعد النهائي",
    req:        "المتطلبات",
    attach:     "المرفقات",
    accept:     "قبول الملخص",
    reject:     "رفض الملخص",
    requestChanges: "طلب تعديلات",
    rejectPh:   "سبب الرفض (اختياري)…",
    changesPh:  "مثال: يمكنني تنفيذ هذا المشروع في 3 أيام بدلاً من يومين.",
    send:       "إرسال",
    cancel:     "إلغاء",
    pending:    "في انتظار ردك",
    accepted:   "✅ تم قبول الملخص",
    rejected:   "❌ تم رفض الملخص",
    changes:    "تم طلب تعديلات",
    reason:     "السبب",
    proposal:   "آخر اقتراح",
    brandPending: "في انتظار رد الموهبة على الملخص…",
    priceTitle: "الاتفاق على السعر",
    priceRange: "الميزانية المقترحة",
    proposePrice: "اقترح سعر",
    proposePricePh: "اكتب رقمك…",
    proposeMessagePh: "رسالة (اختياري)…",
    acceptPrice: "موافق",
    counterPrice: "اقترح رقم تاني",
    currentProposal: "السعر المقترح حاليًا",
    proposedByBrand: "من البراند",
    proposedByTalent: "من الموهبة",
    waitingOther: "وافقت على السعر — في انتظار الطرف التاني",
    priceAgreed: "تم الاتفاق على السعر",
  },
  en: {
    title:      "Project Brief",
    deadline:   "Deadline",
    req:        "Requirements",
    attach:     "Attachments",
    accept:     "Accept Brief",
    reject:     "Reject Brief",
    requestChanges: "Request Changes",
    rejectPh:   "Reason for rejection (optional)…",
    changesPh:  "Example: I can do this project for 3 days instead of 2.",
    send:       "Send",
    cancel:     "Cancel",
    pending:    "Awaiting your response",
    accepted:   "✅ Brief Accepted",
    rejected:   "❌ Brief Rejected",
    changes:    "Changes requested",
    reason:     "Reason",
    proposal:   "Latest proposal",
    brandPending: "Waiting for talent to respond to the brief…",
    priceTitle: "Agree on a price",
    priceRange: "Proposed budget",
    proposePrice: "Propose a price",
    proposePricePh: "Your number…",
    proposeMessagePh: "Message (optional)…",
    acceptPrice: "Accept",
    counterPrice: "Propose a different price",
    currentProposal: "Currently proposed",
    proposedByBrand: "by the brand",
    proposedByTalent: "by the talent",
    waitingOther: "You accepted — waiting on the other side",
    priceAgreed: "Price agreed",
  },
};

export default function BriefView({
  brief, bookingId, bookingStatus, myRole, dark, lang, onRespond,
  budgetMin = null, budgetMax = null, proposedAmount = null, proposedBy = null,
  brandPriceAck = false, talentPriceAck = false, amount = null,
}: Props) {
  const t  = TX[lang];
  const ar = lang === "ar";
  const BG     = dark ? "#2B211D" : "#FBF7EA";
  const BORDER = dark ? "#3A2E28" : "#E6DCC3";
  const TEXT   = dark ? "#F5EEDB" : "#2B211D";
  const MUTED  = dark ? "#8F8175" : "#8C7D71";
  const GREEN  = "var(--color-primary-text)";
  const GOLD   = "var(--color-accent-strong)";

  const [showReject, setShowReject] = useState(false);
  const [showChanges, setShowChanges] = useState(false);
  const [reason,     setReason]     = useState("");
  const [message,    setMessage]    = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const [showCounter, setShowCounter] = useState(false);
  const [counterAmount, setCounterAmount] = useState("");
  const [counterMessage, setCounterMessage] = useState("");
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  async function respond(action: "accept" | "reject" | "request_changes") {
    if (action === "request_changes" && !message.trim()) {
      setError(lang === "ar" ? "اكتب رسالة التعديل أولاً" : "Write a change request message first");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/bookings/${bookingId}/brief/respond`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reject_reason: reason || null, message: message.trim() || null }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? (lang === "ar" ? "تعذر حفظ الرد" : "Could not save response"));
      return;
    }
    setShowReject(false);
    setShowChanges(false);
    setReason("");
    setMessage("");
    onRespond();
  }

  async function respondPrice(action: "propose_price" | "accept_price", proposeAmount?: number) {
    setPriceLoading(true);
    setPriceError(null);
    const res = await fetch(`/api/bookings/${bookingId}/brief/respond`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        amount: action === "propose_price" ? proposeAmount : undefined,
        message: action === "propose_price" ? (counterMessage.trim() || null) : undefined,
      }),
    });
    setPriceLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setPriceError(data.error ?? (lang === "ar" ? "تعذر حفظ الرد" : "Could not save response"));
      return;
    }
    setShowCounter(false);
    setCounterAmount("");
    setCounterMessage("");
    onRespond();
  }

  const canRespond = myRole === "talent" && ["pending", "brief_sent", "changes_requested"].includes(bookingStatus);
  const statusColor = brief.status === "accepted" ? GREEN : brief.status === "rejected" ? "#ef4444" : brief.status === "changes_requested" ? GOLD : GOLD;
  const statusLabel = brief.status === "accepted" ? t.accepted : brief.status === "rejected" ? t.rejected : brief.status === "changes_requested" ? t.changes : (myRole === "talent" ? t.pending : t.brandPending);

  // ── Flow 2 price negotiation ────────────────────────────────────────────
  // Only relevant for a custom-range booking (budgetMin set) that hasn't
  // been rejected and doesn't have a final `amount` locked in yet. Either
  // side can act here — unlike canRespond above, which is talent-only and
  // governs the BRIEF CONTENT, not the price.
  const isCustomBooking = budgetMin != null;
  const isPriceFinalized = amount != null;
  const canNegotiatePrice = isCustomBooking && !isPriceFinalized
    && ["pending", "brief_sent", "changes_requested"].includes(bookingStatus);
  const myPriceAck = myRole === "brand" ? brandPriceAck : talentPriceAck;

  return (
    <div style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "20px 24px", fontFamily: "'IBM Plex Sans Arabic',sans-serif", direction: ar ? "rtl" : "ltr" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FileText size={18} color={GREEN} />
          <h3 style={{ margin: 0, color: TEXT, fontSize: 16, fontWeight: 800 }}>{t.title}</h3>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: statusColor, padding: "3px 10px", borderRadius: 20, backgroundColor: `color-mix(in srgb, ${statusColor} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${statusColor} 20%, transparent)` }}>
          {statusLabel}
        </span>
      </div>

      <h2 style={{ color: TEXT, fontSize: 18, fontWeight: 900, margin: "0 0 10px" }}>{brief.title}</h2>

      {brief.description && (
        <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.7, margin: "0 0 14px" }}>{brief.description}</p>
      )}

      {brief.requirements && (
        <div style={{ backgroundColor: dark ? "#1B1310" : "#F6F0DD", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 16px", marginBottom: 14 }}>
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
          <p style={{ color: brief.status === "changes_requested" ? GOLD : "#EF4444", fontSize: 13, margin: 0 }}><strong>{brief.status === "changes_requested" ? t.proposal : t.reason}:</strong> {brief.reject_reason}</p>
        </div>
      )}

      {isCustomBooking && (
        <div style={{ backgroundColor: dark ? "#1B1310" : "#F6F0DD", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
          <p style={{ color: MUTED, fontSize: 11, fontWeight: 700, margin: "0 0 8px", textTransform: "uppercase" }}>{t.priceTitle}</p>

          {isPriceFinalized ? (
            <p style={{ color: GREEN, fontSize: 14, fontWeight: 800, margin: 0 }}>
              {t.priceAgreed}: {amount!.toLocaleString()} EGP
            </p>
          ) : (
            <>
              <p style={{ color: TEXT, fontSize: 13, margin: "0 0 10px" }}>
                {t.priceRange}: <strong>{budgetMin!.toLocaleString()} – {budgetMax!.toLocaleString()} EGP</strong>
              </p>

              {proposedAmount != null && (
                <p style={{ color: GOLD, fontSize: 13, fontWeight: 700, margin: "0 0 10px" }}>
                  {t.currentProposal}: {proposedAmount.toLocaleString()} EGP
                  {" "}({proposedBy === "brand" ? t.proposedByBrand : t.proposedByTalent})
                </p>
              )}

              {priceError && (
                <div style={{ padding: "9px 12px", borderRadius: 10, backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.28)", color: "#EF4444", fontSize: 13, marginBottom: 10 }}>
                  {priceError}
                </div>
              )}

              {canNegotiatePrice && (
                myPriceAck ? (
                  <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>{t.waitingOther}</p>
                ) : !showCounter ? (
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {proposedAmount != null && (
                      <button onClick={() => respondPrice("accept_price")} disabled={priceLoading}
                        style={{ flex: "1 1 120px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "var(--color-primary)", color: "var(--color-primary-ink)", border: "none", borderRadius: 10, padding: "10px 0", fontSize: 13.5, fontWeight: 900, cursor: priceLoading ? "default" : "pointer", fontFamily: "'IBM Plex Sans Arabic',sans-serif" }}>
                        <CheckCircle2 size={14} /> {t.acceptPrice}
                      </button>
                    )}
                    <button onClick={() => setShowCounter(true)} disabled={priceLoading}
                      style={{ flex: "1 1 140px", backgroundColor: "transparent", color: GOLD, border: `1px solid color-mix(in srgb, ${GOLD} 40%, transparent)`, borderRadius: 10, padding: "10px 0", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "'IBM Plex Sans Arabic',sans-serif" }}>
                      {proposedAmount != null ? t.counterPrice : t.proposePrice}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <input
                      type="number" inputMode="decimal" min={500} step={1}
                      value={counterAmount} onChange={(e) => setCounterAmount(e.target.value)}
                      placeholder={t.proposePricePh}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, backgroundColor: dark ? "#2B211D" : "#FBF7EA", border: `1px solid ${BORDER}`, color: TEXT, fontSize: 13, fontFamily: "'IBM Plex Sans Arabic',sans-serif", outline: "none", boxSizing: "border-box" }}
                    />
                    <textarea
                      value={counterMessage} onChange={(e) => setCounterMessage(e.target.value)}
                      placeholder={t.proposeMessagePh} rows={2}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, backgroundColor: dark ? "#2B211D" : "#FBF7EA", border: `1px solid ${BORDER}`, color: TEXT, fontSize: 13, fontFamily: "'IBM Plex Sans Arabic',sans-serif", outline: "none", boxSizing: "border-box", resize: "vertical" }}
                    />
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        onClick={() => {
                          const n = Number(counterAmount);
                          if (!Number.isFinite(n) || n < 500) { setPriceError(lang === "ar" ? "الحد الأدنى 500 جنيه" : "Minimum 500 EGP"); return; }
                          respondPrice("propose_price", n);
                        }}
                        disabled={priceLoading}
                        style={{ flex: 1, backgroundColor: "var(--color-accent)", color: "var(--color-on-accent)", border: "none", borderRadius: 10, padding: "10px 0", fontSize: 13, fontWeight: 800, cursor: priceLoading ? "default" : "pointer", fontFamily: "'IBM Plex Sans Arabic',sans-serif" }}>
                        {priceLoading ? "…" : t.send}
                      </button>
                      <button onClick={() => setShowCounter(false)}
                        style={{ flex: 1, backgroundColor: "transparent", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 10, padding: "10px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'IBM Plex Sans Arabic',sans-serif" }}>
                        {t.cancel}
                      </button>
                    </div>
                  </div>
                )
              )}
              {canRespond && !isPriceFinalized && (
                <button onClick={() => respond("reject")} disabled={loading}
                  style={{ marginTop: 10, background: "none", border: "none", color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0, fontFamily: "'IBM Plex Sans Arabic',sans-serif" }}>
                  <XCircle size={12} style={{ verticalAlign: "middle", marginInlineEnd: 4 }} />{t.reject}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {error && (
        <div style={{ padding: "9px 12px", borderRadius: 10, backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.28)", color: "#EF4444", fontSize: 13, marginBottom: 12 }}>
          {error}
        </div>
      )}

      {/* Talent response buttons — only when pending */}
      {/* For a custom-range booking, accept/reject happens through the price
          negotiation section above instead — showing both would let the
          talent "accept the brief" without ever agreeing on a number. */}
      {canRespond && !isCustomBooking && (
        <div style={{ marginTop: 16 }}>
          {!showReject && !showChanges ? (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => respond("accept")} disabled={loading}
                style={{ flex: "1 1 140px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "var(--color-primary)", color: "var(--color-primary-ink)", border: "none", borderRadius: 10, padding: "11px 0", fontSize: 14, fontWeight: 900, cursor: loading ? "default" : "pointer", fontFamily: "'IBM Plex Sans Arabic',sans-serif" }}>
                <CheckCircle2 size={14} /> {t.accept}
              </button>
              <button onClick={() => setShowChanges(true)} disabled={loading}
                style={{ flex: "1 1 140px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "transparent", color: GOLD, border: `1px solid color-mix(in srgb, ${GOLD} 40%, transparent)`, borderRadius: 10, padding: "11px 0", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'IBM Plex Sans Arabic',sans-serif" }}>
                {t.requestChanges}
              </button>
              <button onClick={() => setShowReject(true)} disabled={loading}
                style={{ flex: "1 1 140px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "transparent", color: "#ef4444", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 10, padding: "11px 0", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'IBM Plex Sans Arabic',sans-serif" }}>
                <XCircle size={14} /> {t.reject}
              </button>
            </div>
          ) : showReject ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t.rejectPh} rows={3}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, backgroundColor: dark ? "#1B1310" : "#F6F0DD", border: `1px solid ${BORDER}`, color: TEXT, fontSize: 13, fontFamily: "'IBM Plex Sans Arabic',sans-serif", outline: "none", boxSizing: "border-box", resize: "vertical" }} />
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => respond("reject")} disabled={loading}
                  style={{ flex: 1, backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: 10, padding: "11px 0", fontSize: 13, fontWeight: 700, cursor: loading ? "default" : "pointer", fontFamily: "'IBM Plex Sans Arabic',sans-serif" }}>
                  {loading ? "…" : t.send}
                </button>
                <button onClick={() => setShowReject(false)} style={{ flex: 1, backgroundColor: "transparent", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 10, padding: "11px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'IBM Plex Sans Arabic',sans-serif" }}>
                  {t.cancel}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t.changesPh} rows={3}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, backgroundColor: dark ? "#1B1310" : "#F6F0DD", border: `1px solid ${BORDER}`, color: TEXT, fontSize: 13, fontFamily: "'IBM Plex Sans Arabic',sans-serif", outline: "none", boxSizing: "border-box", resize: "vertical" }} />
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => respond("request_changes")} disabled={loading}
                  style={{ flex: 1, backgroundColor: "var(--color-accent)", color: "var(--color-on-accent)", border: "none", borderRadius: 10, padding: "11px 0", fontSize: 13, fontWeight: 800, cursor: loading ? "default" : "pointer", fontFamily: "'IBM Plex Sans Arabic',sans-serif" }}>
                  {loading ? "…" : t.send}
                </button>
                <button onClick={() => setShowChanges(false)} style={{ flex: 1, backgroundColor: "transparent", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 10, padding: "11px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'IBM Plex Sans Arabic',sans-serif" }}>
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
