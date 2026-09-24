"use client";
import { useHeldValue } from "@/hooks/useModalClose";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import EmptyState from "@/components/admin/EmptyState";
import AdminPagination from "@/components/admin/AdminPagination";
import SortableTh from "@/components/admin/SortableTh";
import type { AdminBooking } from "@/features/admin/types";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { PIPELINE, STATUS_COLOR, STATUS_LABEL, type PipelineStatus } from "./bookingStatus";

const TX = {
  ar: { brand: "الشركة", talent: "الموهبة", status: "الحالة", date: "التاريخ", amount: "المبلغ", actions: "الإجراءات", cancel: "إلغاء", noBookings: "لا توجد حجوزات", moveNext: "المرحلة التالية", movePrev: "المرحلة السابقة", results: "نتيجة", reviewPayment: "مراجعة إثبات الدفع", confirmPayment: "تأكيد استلام الدفع", viewProof: "عرض الإثبات", close: "إغلاق" },
  en: { brand: "Brand",   talent: "Talent",  status: "Status", date: "Date",    amount: "Amount", actions: "Actions",    cancel: "Cancel", noBookings: "No bookings", moveNext: "Next Stage", movePrev: "Prev Stage", results: "results", reviewPayment: "Review Payment Proof", confirmPayment: "Confirm Payment Received", viewProof: "View Proof", close: "Close" },
};

interface Props {
  bookings: AdminBooking[];
  total:    number;
  page:     number;
  pageSize: number;
  status:   string;
  sort?:    string;
  dir?:     "asc" | "desc";
}

function hrefFor(page: number, status: string, sort?: string, dir?: "asc" | "desc") {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (status !== "all") params.set("status", status);
  if (sort) { params.set("sort", sort); params.set("dir", dir ?? "asc"); }
  const qs = params.toString();
  return qs ? `/admin/bookings?${qs}` : "/admin/bookings";
}

const SORT_COL = { amount: "amount", status: "status", date: "created_at" } as const;

export default function BookingsTable({ bookings, total, page, pageSize, status, sort, dir }: Props) {
  const { dark, lang } = useSite();
  const router = useRouter();
  const t = TX[lang];
  const ar = lang === "ar";

  function goSort(col: string, nextDir: "asc" | "desc") {
    router.push(hrefFor(1, status, col, nextDir));
    router.refresh();
  }

  const [loading, setLoading] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<AdminBooking | null>(null);
  const { value: reviewingHeld, closing: reviewingClosing } = useHeldValue(reviewing);
  const [confirmingPayment, setConfirmingPayment] = useState(false);

  async function confirmPayment(booking: AdminBooking) {
    setConfirmingPayment(true);
    const res = await fetch(`/api/admin/bookings/${booking.id}/payment/confirm`, { method: "POST" });
    setConfirmingPayment(false);
    if (res.ok) {
      setReviewing(null);
      router.refresh();
    }
  }

  const CARD   = dark ? "#2B211D" : "#FBF7EA";
  const BORDER = dark ? "#3A2E28" : "#E6DCC6";
  const TEXT   = dark ? "#F5EEDB" : "#2B211D";
  const MUTED  = dark ? "#A99B8E" : "#6E5F55";
  const TH     = dark ? "#261C18" : "#F1E8D2";

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function move(booking: AdminBooking, direction: "next" | "prev" | "cancel") {
    const idx = PIPELINE.indexOf(booking.status as typeof PIPELINE[number]);
    let to: PipelineStatus;
    if (direction === "cancel") to = "cancelled";
    else if (direction === "next" && idx < PIPELINE.length - 1) to = PIPELINE[idx + 1];
    else if (direction === "prev" && idx > 0) to = PIPELINE[idx - 1];
    else return;

    setLoading(booking.id);
    await fetch(`/api/admin/bookings/${booking.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: to }),
    });
    setLoading(null);
    router.refresh();
  }

  const cellStyle: React.CSSProperties = { padding: "12px 14px", color: TEXT, fontSize: 13, borderBottom: `1px solid ${BORDER}`, whiteSpace: "nowrap" };
  const thStyle:   React.CSSProperties = { padding: "10px 14px", color: MUTED, fontSize: 12, fontWeight: 600, textAlign: ar ? "right" : "left", backgroundColor: TH, borderBottom: `1px solid ${BORDER}`, whiteSpace: "nowrap" };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <span style={{ color: MUTED, fontSize: 12 }}>{total} {t.results}</span>
      </div>

      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
        {bookings.length === 0 ? <EmptyState message={t.noBookings} /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>{t.brand}</th>
                  <th style={thStyle}>{t.talent}</th>
                  <SortableTh label={t.amount} col={SORT_COL.amount} activeCol={sort} activeDir={dir} onSort={goSort} />
                  <SortableTh label={t.status} col={SORT_COL.status} activeCol={sort} activeDir={dir} onSort={goSort} />
                  <SortableTh label={t.date} col={SORT_COL.date} activeCol={sort} activeDir={dir} onSort={goSort} />
                  <th style={thStyle}>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => {
                  const brand  = Array.isArray(b.brand)  ? b.brand[0]  : b.brand;
                  const talent = Array.isArray(b.talent) ? b.talent[0] : b.talent;
                  const col    = STATUS_COLOR[b.status] ?? { bg: "rgba(169,155,142,0.1)", text: MUTED };
                  const label  = STATUS_LABEL[b.status]?.[lang] ?? b.status;
                  const idx    = PIPELINE.indexOf(b.status as typeof PIPELINE[number]);
                  const isLoading = loading === b.id;
                  const hasPendingPayment = b.status === "accepted" && b.payment?.status === "pending";
                  const canGoPrev = idx > 0;
                  // A pending payment must go through the dedicated confirm
                  // action below (updates the payments row too) — the blunt
                  // status stepper would flip the booking to in_progress
                  // while leaving the payment stuck "pending" forever.
                  const canGoNext = idx < PIPELINE.length - 1 && !hasPendingPayment;
                  const canCancel = b.status !== "cancelled" && b.status !== "paid";

                  return (
                    <tr
                      key={b.id}
                      onClick={() => router.push(`/admin/bookings/${b.id}`)}
                      style={{ opacity: isLoading ? 0.5 : 1, transition: "opacity 0.2s", cursor: "pointer" }}
                    >
                      <td style={cellStyle}>{brand?.full_name ?? "—"}</td>
                      <td style={cellStyle}>{talent?.full_name ?? "—"}</td>
                      <td style={{ ...cellStyle, color: b.amount ? TEXT : MUTED }}>
                        {b.amount ? `$${b.amount.toLocaleString()}` : "—"}
                      </td>
                      <td style={cellStyle}>
                        <span style={{
                          padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                          backgroundColor: col.bg, color: col.text,
                        }}>
                          {label}
                        </span>
                      </td>
                      <td style={{ ...cellStyle, color: MUTED }}>
                        {new Date(b.created_at).toLocaleDateString(ar ? "ar-EG" : "en-US")}
                      </td>
                      <td style={cellStyle} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                          {hasPendingPayment && (
                            <button
                              onClick={() => setReviewing(b)}
                              title={t.reviewPayment}
                              style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(231,165,138,0.12)", border: "1px solid rgba(231,165,138,0.4)", borderRadius: 6, padding: "3px 9px", cursor: "pointer", color: "#E7A58A", fontSize: 11, fontWeight: 700 }}
                            >
                              💳 {t.reviewPayment}
                            </button>
                          )}
                          {canGoPrev && (
                            <button
                              onClick={() => move(b, "prev")}
                              disabled={isLoading}
                              title={t.movePrev}
                              style={{ background: "none", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "3px 6px", cursor: "pointer", color: MUTED, display: "flex" }}
                            >
                              <ChevronLeft size={14} />
                            </button>
                          )}
                          {canGoNext && (
                            <button
                              onClick={() => move(b, "next")}
                              disabled={isLoading}
                              title={t.moveNext}
                              style={{ background: "none", border: `1px solid #087F8355`, borderRadius: 6, padding: "3px 6px", cursor: "pointer", color: "var(--color-primary-text)", display: "flex" }}
                            >
                              <ChevronRight size={14} />
                            </button>
                          )}
                          {canCancel && (
                            <button
                              onClick={() => move(b, "cancel")}
                              disabled={isLoading}
                              title={t.cancel}
                              style={{ background: "none", border: `1px solid rgba(239,68,68,0.3)`, borderRadius: 6, padding: "2px 8px", cursor: "pointer", color: "#EF4444", fontSize: 11, fontWeight: 600 }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminPagination page={page} totalPages={totalPages} buildHref={(p) => hrefFor(p, status, sort, dir)} />

      {reviewingHeld && (
        <div className="modal-backdrop" data-state={reviewingClosing ? "closing" : "open"}
          onClick={() => setReviewing(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(27,19,16,0.62)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, maxWidth: 480, width: "100%" }}>
            <h3 style={{ color: TEXT, fontSize: 15, fontWeight: 800, margin: "0 0 14px" }}>{t.reviewPayment}</h3>
            {reviewingHeld.payment?.proof_url ? (
              <a href={reviewingHeld.payment.proof_url} target="_blank" rel="noreferrer" style={{ display: "block", marginBottom: 16 }}>
                <img src={reviewingHeld.payment.proof_url} alt="" style={{ maxWidth: "100%", maxHeight: 400, borderRadius: 10, border: `1px solid ${BORDER}` }} />
              </a>
            ) : (
              <p style={{ color: MUTED, fontSize: 13, margin: "0 0 16px" }}>—</p>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setReviewing(null)}
                style={{ background: "none", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "9px 16px", cursor: "pointer", color: MUTED, fontSize: 13, fontWeight: 600 }}
              >
                {t.close}
              </button>
              <button
                onClick={() => confirmPayment(reviewingHeld)}
                disabled={confirmingPayment}
                style={{ background: confirmingPayment ? "rgba(8,127,131,0.5)" : "#087F83", border: "none", borderRadius: 8, padding: "9px 18px", cursor: confirmingPayment ? "default" : "pointer", color: "#1B1310", fontSize: 13, fontWeight: 800 }}
              >
                {t.confirmPayment}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
