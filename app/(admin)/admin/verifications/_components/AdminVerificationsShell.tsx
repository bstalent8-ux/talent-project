"use client";
import Link from "next/link";
import { useSite } from "@/contexts/SiteContext";
import AdminShell from "@/components/admin/AdminShell";

const STATUS_FILTERS = ["all", "pending", "approved", "rejected"] as const;

const STATUS_COLOR: Record<string, string> = {
  all: "#4FA7A3", pending: "#E7A58A", approved: "#087F83", rejected: "#EF4444",
};

const TX = {
  ar: { title: "طلبات التحقق", all: "الكل", pending: "قيد الانتظار", approved: "معتمد", rejected: "مرفوض" },
  en: { title: "Verification Requests", all: "All", pending: "Pending", approved: "Approved", rejected: "Rejected" },
};

// Sidebar + topbar + status filter tabs — rendered immediately, never
// suspended. Only the table (children, wrapped in <Suspense> by page.tsx)
// shows a skeleton while its page/filter combo loads.
export default function AdminVerificationsShell({ status, children }: { status: string; children: React.ReactNode }) {
  const { dark, lang } = useSite();
  const t = TX[lang];
  const MUTED = dark ? "#A99B8E" : "#6E5F55";
  const BORDER = dark ? "#3A2E28" : "#E6DCC6";

  return (
    <AdminShell title={t.title}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {STATUS_FILTERS.map((s) => {
          const active = status === s;
          const col = STATUS_COLOR[s];
          return (
            <Link
              key={s}
              href={`/admin/verifications?status=${s}`}
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
