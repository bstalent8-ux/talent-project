"use client";
import Link from "next/link";
import { useSite } from "@/contexts/SiteContext";
import AdminShell from "@/components/admin/AdminShell";

const STATUS_FILTERS = ["all", "pending", "approved", "rejected", "suspended"] as const;

const TX = {
  ar: { title: "المواهب", all: "الكل", pending: "قيد الانتظار", approved: "معتمد", rejected: "مرفوض", suspended: "موقوف" },
  en: { title: "Talents", all: "All", pending: "Pending", approved: "Approved", rejected: "Rejected", suspended: "Suspended" },
};

// Sidebar + topbar + status filter tabs — rendered immediately, never
// suspended. Only the table (passed as `children`, wrapped in <Suspense> by
// page.tsx) shows a skeleton while its page/filter combo loads.
export default function AdminTalentsShell({ status, children }: { status: string; children: React.ReactNode }) {
  const { dark, lang } = useSite();
  const t = TX[lang];
  const MUTED = dark ? "#94a3b8" : "#64748b";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";

  return (
    <AdminShell title={t.title}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {STATUS_FILTERS.map((s) => {
          const active = status === s;
          return (
            <Link
              key={s}
              href={s === "all" ? "/admin/talents" : `/admin/talents?status=${s}`}
              style={{
                padding: "7px 16px", borderRadius: 20,
                border: `1px solid ${active ? "#00D26A" : BORDER}`,
                backgroundColor: active ? "rgba(0,210,106,0.1)" : "transparent",
                color: active ? "#00D26A" : MUTED, fontSize: 13, fontWeight: active ? 700 : 400,
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
