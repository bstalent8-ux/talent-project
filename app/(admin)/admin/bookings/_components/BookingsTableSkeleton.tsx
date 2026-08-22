"use client";
import { useSite } from "@/contexts/SiteContext";
import { SkeletonBlock, SkeletonStyles } from "@/components/admin/Skeleton";

const ROWS = 10;

const TX = { ar: { brand: "الشركة", talent: "الموهبة", status: "الحالة", date: "التاريخ", amount: "المبلغ", actions: "الإجراءات" },
             en: { brand: "Brand",  talent: "Talent",  status: "Status", date: "Date",    amount: "Amount", actions: "Actions" } };

// Same table shell/column widths as BookingsTable, so swapping skeleton for
// real rows causes no layout shift. Pagination area reserves its height too.
export default function BookingsTableSkeleton() {
  const { dark, lang } = useSite();
  const t = TX[lang];
  const ar = lang === "ar";

  const CARD   = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const MUTED  = dark ? "#94a3b8" : "#64748b";
  const TH     = dark ? "#0a121c" : "#f8fafc";

  const cellStyle: React.CSSProperties = { padding: "12px 14px", borderBottom: `1px solid ${BORDER}` };
  const thStyle:   React.CSSProperties = { padding: "10px 14px", color: MUTED, fontSize: 12, fontWeight: 600, textAlign: ar ? "right" : "left", backgroundColor: TH, borderBottom: `1px solid ${BORDER}`, whiteSpace: "nowrap" };

  return (
    <>
      <SkeletonStyles />
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <SkeletonBlock width={70} height={12} />
      </div>

      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
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
              {Array.from({ length: ROWS }, (_, i) => (
                <tr key={i}>
                  <td style={cellStyle}><SkeletonBlock width={110} /></td>
                  <td style={cellStyle}><SkeletonBlock width={110} /></td>
                  <td style={cellStyle}><SkeletonBlock width={60} /></td>
                  <td style={cellStyle}><SkeletonBlock width={80} height={20} radius={20} /></td>
                  <td style={cellStyle}><SkeletonBlock width={80} /></td>
                  <td style={cellStyle}><SkeletonBlock width={70} height={20} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reserves the pagination row's height so its later appearance/
          disappearance never shifts the layout underneath it. */}
      <div style={{ height: 34, marginTop: 20 }} />
    </>
  );
}
