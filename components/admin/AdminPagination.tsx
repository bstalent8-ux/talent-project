"use client";
import Link from "next/link";
import { useSite } from "@/contexts/SiteContext";

interface Props {
  page:       number;
  totalPages: number;
  /** Builds the href for a given page number, preserving every other filter. */
  buildHref:  (page: number) => string;
}

const TX = {
  ar: { prev: "السابق", next: "التالي", page: (p: number, n: number) => `صفحة ${p} من ${n}` },
  en: { prev: "Prev",   next: "Next",   page: (p: number, n: number) => `Page ${p} of ${n}` },
};

// URL-driven pagination — every control is a real <Link>, so browser refresh,
// back/forward, and direct URLs all reproduce the exact same page. Reused by
// every Admin list page (bookings, talents, brands, talent-demand, ...).
export default function AdminPagination({ page, totalPages, buildHref }: Props) {
  const { dark, lang } = useSite();
  const t = TX[lang];
  const ar = lang === "ar";

  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#94a3b8" : "#64748b";
  const GREEN  = "#00D26A";

  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce<(number | "…")[]>((acc, p, i, arr) => {
      if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
      acc.push(p);
      return acc;
    }, []);

  const navStyle = (disabled: boolean): React.CSSProperties => ({
    padding: "6px 14px", borderRadius: 8,
    border: `1px solid ${BORDER}`,
    color: disabled ? MUTED : TEXT, opacity: disabled ? 0.4 : 1, fontSize: 13,
    textDecoration: "none", pointerEvents: disabled ? "none" : "auto",
  });

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 20, flexWrap: "wrap" }}>
      <Link href={buildHref(Math.max(1, page - 1))} aria-disabled={page === 1} style={navStyle(page === 1)}>
        {t.prev}
      </Link>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} style={{ color: MUTED, fontSize: 13, padding: "0 4px" }}>…</span>
        ) : (
          <Link
            key={p}
            href={buildHref(p)}
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

      <Link href={buildHref(Math.min(totalPages, page + 1))} aria-disabled={page === totalPages} style={navStyle(page === totalPages)}>
        {t.next}
      </Link>

      <span style={{ color: MUTED, fontSize: 12, marginRight: ar ? 0 : 8, marginLeft: ar ? 8 : 0 }}>
        {t.page(page, totalPages)}
      </span>
    </div>
  );
}

// Static placeholder reserving the exact height of AdminPagination, shown by
// skeletons so the real pagination bar's later appearance never shifts layout.
export function AdminPaginationSkeleton() {
  return <div style={{ height: 34, marginTop: 20 }} />;
}
