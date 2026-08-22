"use client";
import Link from "next/link";
import { useSite } from "@/contexts/SiteContext";
import AdminShell from "@/components/admin/AdminShell";

const STATUS_FILTERS = ["all", "pending", "approved", "rejected"] as const;

const STATUS_COLOR: Record<string, string> = {
  all: "#60a5fa", pending: "#F4B740", approved: "#00D26A", rejected: "#EF4444",
};

const TX = {
  ar: { title: "مراجعة التقييمات", all: "الكل", pending: "قيد المراجعة", approved: "معتمد", rejected: "مرفوض" },
  en: { title: "Reviews Moderation", all: "All", pending: "Pending", approved: "Approved", rejected: "Rejected" },
};

// Sidebar + topbar + status filter tabs — rendered immediately, never
// suspended. Only the reviews table (children, wrapped in <Suspense> by
// page.tsx) shows a skeleton while its page/filter combo loads.
export default function AdminReviewsShell({ status, children }: { status: string; children: React.ReactNode }) {
  const { dark, lang } = useSite();
  const t = TX[lang];
  const MUTED = dark ? "#94a3b8" : "#64748b";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";

  return (
    <AdminShell title={t.title}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {STATUS_FILTERS.map((s) => {
          const active = status === s;
          const col = STATUS_COLOR[s];
          return (
            <Link
              key={s}
              href={s === "all" ? "/admin/reviews" : `/admin/reviews?status=${s}`}
              style={{
                padding: "6px 14px", borderRadius: 20,
                border: `1px solid ${active ? col : BORDER}`,
                backgroundColor: active ? `${col}22` : "transparent",
                color: active ? col : MUTED, fontSize: 12, fontWeight: active ? 700 : 400,
                textDecoration: "none",
              }}
            >
              {t[s]}
            </Link>
          );
        })}
      </div>
      {children}
    </AdminShell>
  );
}
