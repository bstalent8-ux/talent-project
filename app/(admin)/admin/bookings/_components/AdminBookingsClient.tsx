"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import AdminShell from "@/components/admin/AdminShell";
import EmptyState from "@/components/admin/EmptyState";
import type { AdminBooking } from "@/features/admin/types";
import { ChevronRight, ChevronLeft } from "lucide-react";

const PIPELINE = [
  "contacting", "brief_sent", "accepted",
  "payment_pending", "in_progress", "completed", "paid",
] as const;
type PipelineStatus = typeof PIPELINE[number] | "cancelled";

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  contacting:      { bg: "rgba(148,163,184,0.15)", text: "#94a3b8" },
  brief_sent:      { bg: "rgba(96,165,250,0.15)",  text: "#60a5fa" },
  accepted:        { bg: "rgba(167,139,250,0.15)", text: "#a78bfa" },
  payment_pending: { bg: "rgba(244,183,64,0.15)",  text: "#F4B740" },
  in_progress:     { bg: "rgba(251,146,60,0.15)",  text: "#fb923c" },
  completed:       { bg: "rgba(0,210,106,0.15)",   text: "#00D26A" },
  paid:            { bg: "rgba(0,210,106,0.25)",   text: "#00D26A" },
  cancelled:       { bg: "rgba(239,68,68,0.15)",   text: "#EF4444" },
};

const STATUS_LABEL: Record<string, { ar: string; en: string }> = {
  contacting:      { ar: "تواصل",        en: "Contacting"     },
  brief_sent:      { ar: "إرسال البريف", en: "Brief Sent"     },
  accepted:        { ar: "مقبول",        en: "Accepted"       },
  payment_pending: { ar: "انتظار دفع",   en: "Payment Pending"},
  in_progress:     { ar: "جاري التنفيذ", en: "In Progress"    },
  completed:       { ar: "مكتمل",        en: "Completed"      },
  paid:            { ar: "تم الدفع",     en: "Paid"           },
  cancelled:       { ar: "ملغي",         en: "Cancelled"      },
};

const FILTERS = ["all", ...PIPELINE, "cancelled"] as const;

const TX = {
  ar: { title: "الحجوزات", brand: "الشركة", talent: "الموهبة", status: "الحالة", date: "التاريخ", amount: "المبلغ", actions: "الإجراءات", all: "الكل", cancel: "إلغاء", noBookings: "لا توجد حجوزات", moveNext: "المرحلة التالية", movePrev: "المرحلة السابقة" },
  en: { title: "Bookings", brand: "Brand",   talent: "Talent",  status: "Status", date: "Date",    amount: "Amount", actions: "Actions",    all: "All",   cancel: "Cancel", noBookings: "No bookings", moveNext: "Next Stage", movePrev: "Prev Stage" },
};

const PAGE_SIZE = 10;

export default function AdminBookingsClient({ bookings }: { bookings: AdminBooking[] }) {
  const { dark, lang } = useSite();
  const router = useRouter();
  const t = TX[lang];
  const ar = lang === "ar";

  const [filter,  setFilter]  = useState<typeof FILTERS[number]>("all");
  const [loading, setLoading] = useState<string | null>(null);
  const [page,    setPage]    = useState(1);

  const CARD   = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#94a3b8" : "#64748b";
  const TH     = dark ? "#0a121c" : "#f8fafc";
  const GREEN  = "#00D26A";

  const filtered = useMemo(() => {
    const list = filter === "all" ? bookings : bookings.filter(b => b.status === filter);
    return list;
  }, [bookings, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // reset to page 1 when filter changes
  function changeFilter(f: typeof FILTERS[number]) {
    setFilter(f);
    setPage(1);
  }

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
    <AdminShell title={t.title}>
      {/* Pipeline filter tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {FILTERS.map(s => {
          const active = filter === s;
          const color  = s === "all" ? "#60a5fa" : (STATUS_COLOR[s]?.text ?? MUTED);
          return (
            <button
              key={s}
              onClick={() => changeFilter(s)}
              style={{
                padding: "6px 14px", borderRadius: 20, cursor: "pointer",
                border: `1px solid ${active ? color : BORDER}`,
                backgroundColor: active ? `${color}22` : "transparent",
                color: active ? color : MUTED, fontSize: 12, fontWeight: active ? 700 : 400,
              }}
            >
              {s === "all" ? t.all : (STATUS_LABEL[s]?.[lang] ?? s)}
            </button>
          );
        })}
        <span style={{ color: MUTED, fontSize: 12, alignSelf: "center", marginLeft: "auto" }}>
          {filtered.length} {ar ? "نتيجة" : "results"}
        </span>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
        {filtered.length === 0 ? <EmptyState message={t.noBookings} /> : (
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
                {paginated.map(b => {
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
                          {/* Prev stage */}
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
                          {/* Next stage */}
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
                          {/* Cancel */}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 6, marginTop: 20,
        }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: "6px 14px", borderRadius: 8, cursor: page === 1 ? "default" : "pointer",
              border: `1px solid ${BORDER}`, background: "none",
              color: page === 1 ? MUTED : TEXT, opacity: page === 1 ? 0.4 : 1, fontSize: 13,
            }}
          >
            {ar ? "السابق" : "Prev"}
          </button>

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
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  style={{
                    width: 34, height: 34, borderRadius: 8, cursor: "pointer",
                    border: `1px solid ${page === p ? GREEN : BORDER}`,
                    backgroundColor: page === p ? `${GREEN}22` : "transparent",
                    color: page === p ? GREEN : TEXT,
                    fontSize: 13, fontWeight: page === p ? 700 : 400,
                  }}
                >
                  {p}
                </button>
              )
            )}

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: "6px 14px", borderRadius: 8, cursor: page === totalPages ? "default" : "pointer",
              border: `1px solid ${BORDER}`, background: "none",
              color: page === totalPages ? MUTED : TEXT, opacity: page === totalPages ? 0.4 : 1, fontSize: 13,
            }}
          >
            {ar ? "التالي" : "Next"}
          </button>

          <span style={{ color: MUTED, fontSize: 12, marginRight: ar ? 0 : 8, marginLeft: ar ? 8 : 0 }}>
            {ar ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
          </span>
        </div>
      )}
    </AdminShell>
  );
}
