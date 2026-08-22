"use client";
import { useSite } from "@/contexts/SiteContext";
import { SkeletonBlock, SkeletonStyles } from "./Skeleton";
import { AdminPaginationSkeleton } from "./AdminPagination";

export interface SkeletonColumn {
  label: string;
  /** Skeleton block width for this column's cells. */
  width: number;
  /** Renders as a rounded pill (status-badge shape) instead of a bar. */
  pill?: boolean;
}

interface Props {
  columns: SkeletonColumn[];
  rows?:   number;
  /** Show the results-count line above the table (bookings/talents/brands do; not every page does). */
  showResultsCount?: boolean;
}

// Generic Admin table skeleton — same header labels/column layout as the
// real table it stands in for, so swapping one for the other causes no
// layout shift. Reused by every paginated Admin list page.
export default function AdminTableSkeleton({ columns, rows = 10, showResultsCount = true }: Props) {
  const { dark, lang } = useSite();
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
      {showResultsCount && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <SkeletonBlock width={70} height={12} />
        </div>
      )}

      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {columns.map((col) => <th key={col.label} style={thStyle}>{col.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }, (_, i) => (
                <tr key={i}>
                  {columns.map((col, ci) => (
                    <td key={ci} style={cellStyle}>
                      {col.pill
                        ? <SkeletonBlock width={col.width} height={20} radius={20} />
                        : <SkeletonBlock width={col.width} />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AdminPaginationSkeleton />
    </>
  );
}
