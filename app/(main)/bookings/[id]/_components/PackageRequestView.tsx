"use client";

// ─── Package booking request — Flow 1 talent-side ──────────────────────────
// Counterpart to BriefView.tsx, but for a booking created via
// /api/bookings/package (fixed price, no booking_briefs row — see
// PackageBookingModal.tsx's header comment). Only two outcomes: accept or
// decline. No price negotiation — the package price is fixed by the talent's
// own listing, so there is nothing to counter-propose. Reuses the existing
// /api/bookings/[id]/brief/respond endpoint: it updates booking_briefs only
// when a row exists (a no-op otherwise) and always updates bookings.status,
// which is all a package booking needs.

import { useState } from "react";
import { CheckCircle2, XCircle, Package, Calendar } from "lucide-react";

interface Props {
  bookingId: string;
  bookingStatus: string;
  packageName: string;
  scheduledDate: string | null;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  amount: number | null;
  myRole: "brand" | "talent";
  dark: boolean;
  lang: "ar" | "en";
  onRespond: () => void;
}

const TX = {
  ar: {
    title: "طلب حجز باقة",
    accept: "قبول",
    decline: "رفض",
    accepted: "✅ تم القبول",
    rejected: "❌ تم الرفض",
    pending: "في انتظار ردك",
    brandPending: "في انتظار رد الموهبة",
    date: "الموعد",
    total: "الإجمالي",
    error: "تعذر حفظ الرد",
  },
  en: {
    title: "Package Booking Request",
    accept: "Accept",
    decline: "Decline",
    accepted: "✅ Accepted",
    rejected: "❌ Declined",
    pending: "Awaiting your response",
    brandPending: "Waiting for the talent to respond",
    date: "Date",
    total: "Total",
    error: "Could not save response",
  },
};

export default function PackageRequestView({
  bookingId, bookingStatus, packageName, scheduledDate, scheduledStart, scheduledEnd,
  amount, myRole, dark, lang, onRespond,
}: Props) {
  const t = TX[lang];
  const ar = lang === "ar";
  const BG     = dark ? "#0d1623" : "#ffffff";
  const BORDER = dark ? "#1e293b" : "#e2e8f0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#64748b" : "#94a3b8";
  const GREEN  = "#00D26A";
  const GOLD   = "#FFB800";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canRespond = myRole === "talent" && ["pending", "brief_sent"].includes(bookingStatus);
  const statusColor = bookingStatus === "accepted" || bookingStatus === "paid" || bookingStatus === "in_progress" || bookingStatus === "completed"
    ? GREEN : bookingStatus === "rejected" ? "#ef4444" : GOLD;
  const statusLabel = bookingStatus === "rejected"
    ? t.rejected
    : ["accepted", "payment_pending", "in_progress", "completed", "paid"].includes(bookingStatus)
      ? t.accepted
      : (myRole === "talent" ? t.pending : t.brandPending);

  async function respond(action: "accept" | "reject") {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/bookings/${bookingId}/brief/respond`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? t.error);
      return;
    }
    onRespond();
  }

  return (
    <div style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "20px 24px", fontFamily: "'IBM Plex Sans Arabic',sans-serif", direction: ar ? "rtl" : "ltr" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Package size={18} color={GREEN} />
          <h3 style={{ margin: 0, color: TEXT, fontSize: 16, fontWeight: 800 }}>{t.title}</h3>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: statusColor, padding: "3px 10px", borderRadius: 20, backgroundColor: `${statusColor}15`, border: `1px solid ${statusColor}33` }}>
          {statusLabel}
        </span>
      </div>

      <h2 style={{ color: TEXT, fontSize: 18, fontWeight: 900, margin: "0 0 10px" }}>{packageName}</h2>

      {scheduledDate && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, fontSize: 13 }}>
          <Calendar size={14} color={GOLD} />
          <span style={{ color: MUTED }}>{t.date}: </span>
          <span style={{ color: TEXT, fontWeight: 700 }}>
            {scheduledDate}{scheduledStart && scheduledEnd ? ` · ${scheduledStart}–${scheduledEnd}` : ""}
          </span>
        </div>
      )}

      {amount != null && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, fontSize: 13 }}>
          <span style={{ color: MUTED }}>{t.total}: </span>
          <span style={{ color: GOLD, fontWeight: 900, fontFamily: "monospace" }}>{amount.toLocaleString()} EGP</span>
        </div>
      )}

      {error && (
        <div style={{ padding: "9px 12px", borderRadius: 10, backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.28)", color: "#EF4444", fontSize: 13, marginBottom: 12 }}>
          {error}
        </div>
      )}

      {canRespond && (
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button onClick={() => respond("accept")} disabled={loading}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: GREEN, color: "#050B12", border: "none", borderRadius: 10, padding: "11px 0", fontSize: 14, fontWeight: 900, cursor: loading ? "default" : "pointer", fontFamily: "'IBM Plex Sans Arabic',sans-serif" }}>
            <CheckCircle2 size={14} /> {t.accept}
          </button>
          <button onClick={() => respond("reject")} disabled={loading}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "transparent", color: "#ef4444", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 10, padding: "11px 0", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'IBM Plex Sans Arabic',sans-serif" }}>
            <XCircle size={14} /> {t.decline}
          </button>
        </div>
      )}
    </div>
  );
}
