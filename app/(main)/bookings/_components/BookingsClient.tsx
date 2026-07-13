"use client";
import Link from "next/link";
import { useSite } from "@/contexts/SiteContext";

const STATUS_LABELS: Record<string, { ar: string; en: string; color: string }> = {
  contacting:      { ar: "تواصل",          en: "Contacting",       color: "#64748b" },
  brief_sent:      { ar: "تم إرسال الملخص", en: "Brief Sent",       color: "#3b82f6" },
  accepted:        { ar: "تم القبول",       en: "Accepted",         color: "#8b5cf6" },
  payment_pending: { ar: "في انتظار الدفع", en: "Payment Pending",  color: "#f59e0b" },
  in_progress:     { ar: "جاري التنفيذ",   en: "In Progress",      color: "#FFB800" },
  completed:       { ar: "مكتمل",          en: "Completed",        color: "#00D26A" },
  paid:            { ar: "تم الدفع",        en: "Paid",             color: "#00D26A" },
  cancelled:       { ar: "ملغي",           en: "Cancelled",        color: "#ef4444" },
};

interface Booking {
  id: string;
  status: string;
  amount: number | null;
  created_at: string;
  service_type: string | null;
  brand:  { full_name: string | null; avatar_url: string | null } | null;
  talent: { full_name: string | null; avatar_url: string | null } | null;
  job:    { title: string } | null;
  brief:  { status: string } | null;
}

interface Props { bookings: Record<string, unknown>[]; myRole: string; myId: string }

export default function BookingsClient({ bookings, myRole }: Props) {
  const { dark, lang } = useSite();
  const ar = lang === "ar";

  const BG     = dark ? "#090e1a" : "#f8fafc";
  const CARD   = dark ? "#0d1623" : "#ffffff";
  const BORDER = dark ? "#1e293b" : "#e2e8f0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#64748b" : "#94a3b8";
  const GOLD   = "#FFB800";

  const isBrand = myRole === "brand";
  const tx = {
    title:   ar ? "مشاريعي" : "My Projects",
    empty:   ar ? "لا توجد مشاريع بعد" : "No projects yet",
    emptyS:  ar ? "عندما تقبل عروضاً ستظهر هنا" : "Accepted proposals will appear here",
    view:    ar ? "عرض التفاصيل" : "View Details",
    amount:  ar ? "المبلغ" : "Amount",
    job:     ar ? "الوظيفة" : "Job",
    status:  ar ? "الحالة" : "Status",
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: BG, padding: "32px 24px", fontFamily: "'Cairo',sans-serif", direction: ar ? "rtl" : "ltr" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ color: TEXT, fontSize: 26, fontWeight: 900, marginBottom: 24 }}>{tx.title}</h1>

        {bookings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 24px", color: MUTED }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <p style={{ fontSize: 16, margin: 0 }}>{tx.empty}</p>
            <p style={{ fontSize: 13, margin: "8px 0 0", color: GOLD }}>{tx.emptyS}</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {(bookings as Booking[]).map((b) => {
              const sl = STATUS_LABELS[b.status] ?? { ar: b.status, en: b.status, color: MUTED };
              const other = isBrand ? b.talent : b.brand;
              const daysAgo = Math.floor((Date.now() - new Date(b.created_at).getTime()) / 86400000);
              return (
                <div key={b.id} style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  {/* Avatar */}
                  <div style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: dark ? "#1e293b" : "#e2e8f0", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: MUTED }}>
                    {other?.avatar_url
                      ? <img src={other.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : (other?.full_name ?? "?")[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: TEXT }}>{other?.full_name ?? "—"}</p>
                    {b.job && <p style={{ margin: "2px 0 0", fontSize: 12, color: MUTED }}>{b.job.title}</p>}
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: MUTED }}>{daysAgo === 0 ? (ar ? "اليوم" : "Today") : ar ? `منذ ${daysAgo} يوم` : `${daysAgo}d ago`}</p>
                  </div>

                  {/* Amount */}
                  {b.amount && (
                    <div style={{ textAlign: "center" }}>
                      <p style={{ margin: 0, fontSize: 11, color: MUTED }}>{tx.amount}</p>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: GOLD }}>{b.amount.toLocaleString()} EGP</p>
                    </div>
                  )}

                  {/* Status badge */}
                  <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, backgroundColor: `${sl.color}18`, color: sl.color, border: `1px solid ${sl.color}33`, whiteSpace: "nowrap" }}>
                    {ar ? sl.ar : sl.en}
                  </span>

                  {/* CTA */}
                  <Link href={`/bookings/${b.id}`} style={{ padding: "8px 18px", backgroundColor: GOLD, color: "#000", borderRadius: 10, fontWeight: 700, fontSize: 13, textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>
                    {tx.view}
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
