"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import EmptyState from "@/components/admin/EmptyState";
import type { AdminBooking } from "@/features/admin/types";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { PIPELINE, STATUS_COLOR, STATUS_LABEL, type PipelineStatus } from "./bookingStatus";

const TX = {
  ar: { brand: "الشركة", talent: "الموهبة", status: "الحالة", date: "التاريخ", amount: "المبلغ", actions: "الإجراءات", cancel: "إلغاء", noBookings: "لا توجد حجوزات", moveNext: "المرحلة التالية", movePrev: "المرحلة السابقة", results: "نتيجة", prev: "السابق", next: "التالي", page: (p: number, n: number) => `صفحة ${p} من ${n}` },
  en: { brand: "Brand",   talent: "Talent",  status: "Status", date: "Date",    amount: "Amount", actions: "Actions",    cancel: "Cancel", noBookings: "No bookings", moveNext: "Next Stage", movePrev: "Prev Stage", results: "results", prev: "Prev", next: "Next", page: (p: number, n: number) => `Page ${p} of ${n}` },
};

interface Props {
  bookings: AdminBooking[];
  total:    number;
  page:     number;
  pageSize: number;
  status:   string;
}

function hrefFor(page: number, status: string) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (status !== "all") params.set("status", status);
  const qs = params.toString();
  return qs ? `/admin/bookings?${qs}` : "/admin/bookings";
}

export default function BookingsTable({ bookings, total, page, pageSize, status }: Props) {
  const { dark, lang } = useSite();
  const router = useRouter();
  const t = TX[lang];
  const ar = lang === "ar";

  const [loading, setLoading] = useState<string | null>(null);

  const CARD   = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#94a3b8" : "#64748b";
  const TH     = dark ? "#0a121c" : "#f8fafc";
  const GREEN  = "#00D26A";

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
                  <th style={thStyle}>{t.amount}</th>
                  <th style={thStyle}>{t.status}</th>
                  <th style={thStyle}>{t.date}</th>
                  <th style={thStyle}>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => {
                  const brand  = Array.isArray(b.brand)  ? b.brand[0]  : b.brand;
                  const talent = Array.isArray(b.talent) ? b.talent[0] : b.talent;
                  const col    = STATUS_COLOR[b.status] ?? { bg: "rgba(148,163,184,0.1)", text: MUTED };
                  const label  = STATUS_LABEL[b.status]?.[lang] ?? b.status;
                  const idx    = PIPELINE.indexOf(b.status as typeof PIPELINE[number]);
                  const isLoading = loading === b.id;
                  const canGoPrev = idx > 0;
                  const canGoNext = idx < PIPELINE.length - 1;
                  const canCancel = b.status !== "cancelled" && b.status !== "paid";

                  return (
                    <tr key={b.id} style={{ opacity: isLoading ? 0.5 : 1, transition: "opacity 0.2s" }}>
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
                      <td style={cellStyle}>
                        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
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
                              style={{ background: "none", border: `1px solid #00D26A55`, borderRadius: 6, padding: "3px 6px", cursor: "pointer", color: "#00D26A", display: "flex" }}
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

      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 20 }}>
          <Link
            href={hrefFor(Math.max(1, page - 1), status)}
            aria-disabled={page === 1}
            style={{
              padding: "6px 14px", borderRadius: 8,
              border: `1px solid ${BORDER}`,
              color: page === 1 ? MUTED : TEXT, opacity: page === 1 ? 0.4 : 1, fontSize: 13,
              textDecoration: "none", pointerEvents: page === 1 ? "none" : "auto",
            }}
          >
            {t.prev}
          </Link>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce<(number | "…")[]>((acc, p, i, arr) => {
              if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === "…" ? (
                <span key={`ellipsis-${i}`} style={{ color: MUTED, fontSize: 13, padding: "0 4px" }}>…</span>
              ) : (
                <Link
                  key={p}
                  href={hrefFor(p as number, status)}
                  style={{
                    width: 34, height: 34, borderRadius: 8,
                    border: `1px solid ${page === p ? GREEN : BORDER}`,
                    backgroundColor: page === p ? `${GREEN}22` : "transparent",
                    color: page === p ? GREEN : TEXT,
                    fontSize: 13, fontWeight: page === p ? 700 : 400,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    textDecoration: "none",
                  }}
                >
                  {p}
                </Link>
              )
            )}

          <Link
            href={hrefFor(Math.min(totalPages, page + 1), status)}
            aria-disabled={page === totalPages}
            style={{
              padding: "6px 14px", borderRadius: 8,
              border: `1px solid ${BORDER}`,
              color: page === totalPages ? MUTED : TEXT, opacity: page === totalPages ? 0.4 : 1, fontSize: 13,
              textDecoration: "none", pointerEvents: page === totalPages ? "none" : "auto",
            }}
          >
            {t.next}
          </Link>

          <span style={{ color: MUTED, fontSize: 12, marginRight: ar ? 0 : 8, marginLeft: ar ? 8 : 0 }}>
            {t.page(page, totalPages)}
          </span>
        </div>
      )}
    </>
  );
}
