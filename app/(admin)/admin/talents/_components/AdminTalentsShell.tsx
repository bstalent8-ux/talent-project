"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import AdminShell from "@/components/admin/AdminShell";
import { formatTalentTag } from "@/lib/talent-tags";
import type { AdminTalentFilterOptions } from "@/features/admin/services/admin.service";

const STATUS_FILTERS = ["all", "pending", "approved", "rejected", "suspended"] as const;

const TX = {
  ar: {
    title: "المواهب", all: "الكل", pending: "قيد الانتظار", approved: "معتمد", rejected: "مرفوض", suspended: "موقوف",
    filterCategory: "التصنيف: الكل", filterCity: "المدينة: الكل",
    duplicateAll: "التكرار: الكل", duplicateWith: "فيه تكرار", duplicateWithout: "بدون تكرار",
  },
  en: {
    title: "Talents", all: "All", pending: "Pending", approved: "Approved", rejected: "Rejected", suspended: "Suspended",
    filterCategory: "Category: All", filterCity: "City: All",
    duplicateAll: "Duplication: All", duplicateWith: "With duplication", duplicateWithout: "Without duplication",
  },
};

interface Props {
  status: string;
  category?: string;
  city?: string;
  duplicate?: "all" | "with" | "without";
  filterOptions: AdminTalentFilterOptions;
  children: React.ReactNode;
}

// Sidebar + topbar + status filter tabs, plus category/city filters —
// rendered immediately, never suspended. Only the table (passed as
// `children`, wrapped in <Suspense> by page.tsx) shows a skeleton while its
// page/filter combo loads.
export default function AdminTalentsShell({ status, category, city, duplicate = "all", filterOptions, children }: Props) {
  const { dark, lang } = useSite();
  const router = useRouter();
  const t = TX[lang];
  const MUTED = dark ? "#94a3b8" : "#64748b";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const TEXT = dark ? "#f1f5f9" : "#0f172a";

  function hrefFor(overrides: Partial<{ status: string; category: string; city: string; duplicate: string }>) {
    const next = { status, category, city, duplicate, ...overrides };
    const params = new URLSearchParams();
    if (next.status && next.status !== "all") params.set("status", next.status);
    if (next.category) params.set("category", next.category);
    if (next.city) params.set("city", next.city);
    if (next.duplicate && next.duplicate !== "all") params.set("duplicate", next.duplicate);
    const qs = params.toString();
    return qs ? `/admin/talents?${qs}` : "/admin/talents";
  }

  return (
    <AdminShell title={t.title}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {STATUS_FILTERS.map((s) => {
            const active = status === s;
            return (
              <Link
                key={s}
                href={hrefFor({ status: s })}
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

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select
            value={category ?? ""}
            onChange={(e) => router.push(hrefFor({ category: e.target.value || undefined }))}
            style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${BORDER}`, backgroundColor: CARD, color: category ? TEXT : MUTED, fontSize: 12.5, cursor: "pointer" }}
          >
            <option value="">{t.filterCategory}</option>
            {filterOptions.categories.map((c) => <option key={c} value={c}>{formatTalentTag(c, lang)}</option>)}
          </select>
          <select
            value={city ?? ""}
            onChange={(e) => router.push(hrefFor({ city: e.target.value || undefined }))}
            style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${BORDER}`, backgroundColor: CARD, color: city ? TEXT : MUTED, fontSize: 12.5, cursor: "pointer" }}
          >
            <option value="">{t.filterCity}</option>
            {filterOptions.cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={duplicate}
            onChange={(e) => router.push(hrefFor({ duplicate: e.target.value }))}
            style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${duplicate !== "all" ? "#F4B740" : BORDER}`, backgroundColor: CARD, color: duplicate !== "all" ? "#F4B740" : MUTED, fontSize: 12.5, cursor: "pointer", fontWeight: duplicate !== "all" ? 700 : 400 }}
          >
            <option value="all">{t.duplicateAll}</option>
            <option value="with">{t.duplicateWith}</option>
            <option value="without">{t.duplicateWithout}</option>
          </select>
        </div>
      </div>
      {children}
    </AdminShell>
  );
}
