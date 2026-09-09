"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import { ArrowLeft, ArrowRight, CreditCard } from "lucide-react";
import { STATUS_COLOR, STATUS_LABEL } from "../../_components/bookingStatus";
import type { AdminBookingFull } from "@/features/admin/types";

const TX = {
  ar: {
    back: "العودة للحجوزات", brand: "البراند", talent: "الموهبة", amount: "المبلغ", service: "نوع الخدمة",
    created: "تاريخ الإنشاء", noTalent: "—",
    payment: "الدفع", noPayment: "لسه مفيش إثبات دفع مرفوع.", proof: "إثبات الدفع",
    platformFee: "عمولة المنصة", talentPayout: "صافي الموهبة", confirm: "تأكيد استلام الدفع", confirming: "جاري التأكيد…",
    brief: "ملخص المشروع", noBrief: "لسه مفيش ملخص اتبعت.", deadline: "الموعد النهائي",
    deliverables: "الأعمال المسلّمة", noDeliverables: "لسه مفيش تسليم.",
    review: "التقييم", noReview: "لسه مفيش تقييم.",
    history: "سجلّ الحالة", noHistory: "لا يوجد سجلّ تغييرات.",
    chat: "المحادثة", noChat: "لا توجد محادثة.",
    by: "بواسطة", system: "النظام",
  },
  en: {
    back: "Back to Bookings", brand: "Brand", talent: "Talent", amount: "Amount", service: "Service Type",
    created: "Created", noTalent: "—",
    payment: "Payment", noPayment: "No payment proof uploaded yet.", proof: "Payment Proof",
    platformFee: "Platform Fee", talentPayout: "Talent Payout", confirm: "Confirm Payment Received", confirming: "Confirming…",
    brief: "Project Brief", noBrief: "No brief sent yet.", deadline: "Deadline",
    deliverables: "Deliverables", noDeliverables: "Nothing delivered yet.",
    review: "Review", noReview: "No review yet.",
    history: "Status Log", noHistory: "No status changes recorded.",
    chat: "Conversation", noChat: "No conversation.",
    by: "by", system: "System",
  },
};

export default function AdminBookingDetailClient({ booking: initial }: { booking: AdminBookingFull }) {
  const { dark, lang } = useSite();
  const ar = lang === "ar";
  const t = TX[lang];
  const router = useRouter();
  const Back = ar ? ArrowRight : ArrowLeft;

  const [booking, setBooking] = useState(initial);
  const [confirming, setConfirming] = useState(false);

  const CARD   = dark ? "#0D1623" : "#FFFFFF";
  const BG     = dark ? "#090e1a" : "#f8fafc";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#94a3b8" : "#64748b";
  const SUB    = dark ? "#0A121C" : "#F8FAFC";

  const sm = STATUS_COLOR[booking.status] ?? { bg: "rgba(148,163,184,0.15)", text: MUTED };
  const smLabel = STATUS_LABEL[booking.status]?.[lang] ?? booking.status;

  const brand  = Array.isArray(booking.brand)  ? booking.brand[0]  : booking.brand;
  const talent = Array.isArray(booking.talent) ? booking.talent[0] : booking.talent;
  const payment = booking.payment as { status?: string; proof_url?: string | null; platform_fee?: number; talent_payout?: number; amount?: number } | null;
  const brief = booking.brief as { title?: string; description?: string; requirements?: string; deadline?: string; status?: string } | null;

  async function confirmPayment() {
    setConfirming(true);
    const res = await fetch(`/api/admin/bookings/${booking.id}/payment/confirm`, { method: "POST" });
    setConfirming(false);
    if (res.ok) {
      const refreshed = await fetch(`/api/admin/bookings/${booking.id}`).then((r) => (r.ok ? r.json() : null));
      if (refreshed?.booking) setBooking(refreshed.booking);
      else router.refresh();
    }
  }

  const section = (title: string, children: React.ReactNode) => (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "18px 22px", marginBottom: 16 }}>
      <h3 style={{ color: TEXT, fontSize: 14.5, fontWeight: 800, margin: "0 0 12px" }}>{title}</h3>
      {children}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: BG, padding: "24px 16px" }}>
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        <button onClick={() => router.push("/admin/bookings")}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 13, marginBottom: 16, padding: 0 }}>
          <Back size={14} /> {t.back}
        </button>

        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: "20px 22px", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <div>
                <p style={{ color: MUTED, fontSize: 11, margin: "0 0 3px" }}>{t.brand}</p>
                <p style={{ color: TEXT, fontSize: 14, fontWeight: 800, margin: 0 }}>{brand?.full_name ?? "—"}</p>
              </div>
              <div>
                <p style={{ color: MUTED, fontSize: 11, margin: "0 0 3px" }}>{t.talent}</p>
                <p style={{ color: TEXT, fontSize: 14, fontWeight: 800, margin: 0 }}>{talent?.full_name ?? t.noTalent}</p>
              </div>
              <div>
                <p style={{ color: MUTED, fontSize: 11, margin: "0 0 3px" }}>{t.amount}</p>
                <p style={{ color: "#F4B740", fontSize: 14, fontWeight: 800, margin: 0 }}>{booking.amount ? `${booking.amount.toLocaleString()} EGP` : "—"}</p>
              </div>
            </div>
            <span style={{ padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, backgroundColor: sm.bg, color: sm.text }}>
              {smLabel}
            </span>
          </div>
          <p style={{ color: MUTED, fontSize: 12, margin: 0 }}>
            {t.service}: {booking.service_type ?? "—"} · {t.created}: {new Date(booking.created_at).toLocaleDateString(ar ? "ar-EG" : "en-GB")}
          </p>
        </div>

        {section(t.payment,
          payment ? (
            <div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: payment.proof_url ? 14 : 0 }}>
                <div><p style={{ color: MUTED, fontSize: 11, margin: "0 0 3px" }}>{t.amount}</p><p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: 0 }}>{payment.amount?.toLocaleString() ?? "—"} EGP</p></div>
                {typeof payment.platform_fee === "number" && <div><p style={{ color: MUTED, fontSize: 11, margin: "0 0 3px" }}>{t.platformFee}</p><p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: 0 }}>{payment.platform_fee.toLocaleString()} EGP</p></div>}
                {typeof payment.talent_payout === "number" && <div><p style={{ color: MUTED, fontSize: 11, margin: "0 0 3px" }}>{t.talentPayout}</p><p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: 0 }}>{payment.talent_payout.toLocaleString()} EGP</p></div>}
                <div><p style={{ color: MUTED, fontSize: 11, margin: "0 0 3px" }}>{t.payment}</p><p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: 0, textTransform: "capitalize" }}>{payment.status}</p></div>
              </div>
              {payment.proof_url && (
                <a href={payment.proof_url} target="_blank" rel="noreferrer" style={{ display: "block", marginBottom: payment.status === "pending" ? 14 : 0 }}>
                  <img src={payment.proof_url} alt={t.proof} style={{ maxWidth: "100%", maxHeight: 320, borderRadius: 10, border: `1px solid ${BORDER}` }} />
                </a>
              )}
              {payment.status === "pending" && (
                <button onClick={confirmPayment} disabled={confirming}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", backgroundColor: confirming ? "rgba(0,210,106,0.5)" : "#00D26A", color: "#050B12", border: "none", borderRadius: 10, cursor: confirming ? "default" : "pointer", fontSize: 13, fontWeight: 800 }}>
                  <CreditCard size={14} /> {confirming ? t.confirming : t.confirm}
                </button>
              )}
            </div>
          ) : <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>{t.noPayment}</p>
        )}

        {section(t.brief,
          brief ? (
            <div>
              {brief.title && <p style={{ color: TEXT, fontSize: 13.5, fontWeight: 700, margin: "0 0 6px" }}>{brief.title}</p>}
              {brief.description && <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.7, margin: "0 0 8px" }}>{brief.description}</p>}
              {brief.deadline && <p style={{ color: MUTED, fontSize: 12, margin: 0 }}>{t.deadline}: {new Date(brief.deadline).toLocaleDateString(ar ? "ar-EG" : "en-GB")}</p>}
            </div>
          ) : <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>{t.noBrief}</p>
        )}

        {section(t.deliverables,
          booking.deliverables.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {booking.deliverables.map((d, i) => {
                const dd = d as { id?: string; status?: string; notes?: string | null; links?: string[] | null; created_at?: string };
                return (
                  <div key={dd.id ?? i} style={{ backgroundColor: SUB, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 12px" }}>
                    <p style={{ color: TEXT, fontSize: 12.5, fontWeight: 700, margin: "0 0 4px", textTransform: "capitalize" }}>{dd.status}</p>
                    {dd.notes && <p style={{ color: MUTED, fontSize: 12.5, margin: "0 0 4px" }}>{dd.notes}</p>}
                    {dd.links?.map((l) => <a key={l} href={l} target="_blank" rel="noreferrer" style={{ display: "block", color: "#00D26A", fontSize: 12, wordBreak: "break-all" }}>{l}</a>)}
                  </div>
                );
              })}
            </div>
          ) : <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>{t.noDeliverables}</p>
        )}

        {section(t.review,
          booking.review ? (
            <p style={{ color: TEXT, fontSize: 13, margin: 0 }}>
              {"★".repeat((booking.review as { rating?: number }).rating ?? 0)} — {(booking.review as { comment?: string | null }).comment ?? ""}
            </p>
          ) : <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>{t.noReview}</p>
        )}

        {section(t.history,
          booking.history.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {booking.history.map((h) => {
                const who = Array.isArray(h.changedBy) ? h.changedBy[0] : h.changedBy;
                return (
                  <div key={h.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, borderTop: `1px solid ${BORDER}`, paddingTop: 8 }}>
                    <p style={{ color: TEXT, fontSize: 12.5, margin: 0 }}>
                      <span style={{ textTransform: "capitalize" }}>{h.from_status}</span> → <span style={{ fontWeight: 700, textTransform: "capitalize" }}>{h.to_status}</span>
                      <span style={{ color: MUTED }}> — {t.by} {who?.full_name ?? t.system}</span>
                    </p>
                    <p style={{ color: MUTED, fontSize: 11.5, margin: 0, whiteSpace: "nowrap" }}>{new Date(h.created_at).toLocaleString(ar ? "ar-EG" : "en-GB")}</p>
                  </div>
                );
              })}
            </div>
          ) : <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>{t.noHistory}</p>
        )}

        {section(t.chat,
          booking.messages.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 420, overflowY: "auto" }}>
              {booking.messages.map((m) => {
                const sender = Array.isArray(m.sender) ? m.sender[0] : m.sender;
                return (
                  <div key={m.id} style={{ backgroundColor: SUB, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "8px 12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 3 }}>
                      <span style={{ color: TEXT, fontSize: 12, fontWeight: 700 }}>{sender?.full_name ?? t.system}</span>
                      <span style={{ color: MUTED, fontSize: 11 }}>{new Date(m.created_at).toLocaleString(ar ? "ar-EG" : "en-GB")}</span>
                    </div>
                    <p style={{ color: MUTED, fontSize: 12.5, margin: 0, whiteSpace: "pre-line" }}>{m.content}</p>
                  </div>
                );
              })}
            </div>
          ) : <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>{t.noChat}</p>
        )}
      </div>
    </div>
  );
}
