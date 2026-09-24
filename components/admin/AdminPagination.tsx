"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import { ChevronDown, Check } from "lucide-react";
import { ADMIN_LIGHT } from "./adminLightTheme";

interface Props {
  page:       number;
  totalPages: number;
  /** Builds the href for a given page number, preserving every other filter. */
  buildHref:  (page: number) => string;
  /** Total row count across every page — enables the "N of TOTAL" label
   * instead of "Page X of Y". Omit to keep the old page-count label
   * (older callers that haven't opted into the row-size picker yet). */
  total?: number;
  /** Rows per page, needed alongside `total` to compute how many rows are
   * actually shown on the current (possibly partial, last) page. */
  pageSize?: number;
  /** Builds the href for switching row-size, resetting to page 1. Required
   * together with `total`/`pageSize` to render the picker. */
  buildPageSizeHref?: (pageSize: number) => string;
  /** Selectable page sizes for the picker. */
  pageSizeOptions?: number[];
}

const TX = {
  ar: {
    prev: "السابق", next: "التالي",
    page: (p: number, n: number) => `صفحة ${p} من ${n}`,
    shown: (shown: number, total: number) => `${shown} من ${total}`,
    perPage: "لكل صفحة",
  },
  en: {
    prev: "Prev", next: "Next",
    page: (p: number, n: number) => `Page ${p} of ${n}`,
    shown: (shown: number, total: number) => `${shown} of ${total}`,
    perPage: "per page",
  },
};

// URL-driven pagination — every control is a real <Link>, so browser refresh,
// back/forward, and direct URLs all reproduce the exact same page. Reused by
// every Admin list page (bookings, talents, brands, talent-demand, ...).
export default function AdminPagination({
  page, totalPages, buildHref,
  total, pageSize, buildPageSizeHref,
  pageSizeOptions = [10, 25, 100],
}: Props) {
  const { dark, lang } = useSite();
  const router = useRouter();
  const t = TX[lang];
  const ar = lang === "ar";
  const showsRowCount = total != null && pageSize != null && !!buildPageSizeHref;
  const shownOnPage = showsRowCount ? Math.max(0, Math.min(pageSize!, total! - (page - 1) * pageSize!)) : 0;

  const BORDER = dark ? "#3A2E28" : ADMIN_LIGHT.border;
  const CARD   = dark ? "#2B211D" : ADMIN_LIGHT.card;
  const TEXT   = dark ? "#F5EEDB" : ADMIN_LIGHT.text;
  const MUTED  = dark ? "#A99B8E" : ADMIN_LIGHT.muted;
  const GREEN  = "#087F83";
  const PRIMARY = dark ? "var(--color-primary)" : ADMIN_LIGHT.primary;

  // Custom dropdown for the page-size picker — a native <select>'s open
  // list is OS/browser-rendered and can't be given rounded corners or the
  // admin palette's colors (the square, browser-default list the redesign
  // was asked to move away from). Same click-outside-closes pattern as
  // AdminSidebar's own "display mode" popup.
  const [sizeOpen, setSizeOpen] = useState(false);
  const sizeBtnRef = useRef<HTMLButtonElement>(null);
  const sizeMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!sizeOpen) return;
    function onClick(e: MouseEvent) {
      const target = e.target as Node;
      if (sizeBtnRef.current?.contains(target)) return;
      if (sizeMenuRef.current && !sizeMenuRef.current.contains(target)) setSizeOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [sizeOpen]);

  // The old behaviour (no row-size picker wired in) still hides entirely on
  // a single page. Once a caller opts into the picker, the bar must stay
  // visible even at one page — otherwise a 100-per-page view that now fits
  // everything on page 1 would have no way back down to 10/25.
  if (totalPages <= 1 && !showsRowCount) return null;

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
      {totalPages > 1 && (
        <Link href={buildHref(Math.max(1, page - 1))} aria-disabled={page === 1} style={navStyle(page === 1)}>
          {t.prev}
        </Link>
      )}

      {totalPages > 1 && pages.map((p, i) =>
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

      {totalPages > 1 && (
        <Link href={buildHref(Math.min(totalPages, page + 1))} aria-disabled={page === totalPages} style={navStyle(page === totalPages)}>
          {t.next}
        </Link>
      )}

      <span style={{ color: MUTED, fontSize: 12, marginRight: ar ? 0 : 8, marginLeft: ar ? 8 : 0 }}>
        {showsRowCount ? t.shown(shownOnPage, total!) : t.page(page, totalPages)}
      </span>

      {showsRowCount && (
        <div style={{ position: "relative", marginRight: ar ? 8 : 0, marginLeft: ar ? 0 : 8 }}>
          <button
            ref={sizeBtnRef}
            type="button"
            onClick={() => setSizeOpen((o) => !o)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 20, border: `1px solid ${sizeOpen ? PRIMARY : BORDER}`,
              backgroundColor: sizeOpen ? `color-mix(in srgb, ${PRIMARY} 10%, transparent)` : "transparent",
              color: TEXT, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
            }}
          >
            {pageSize} {t.perPage}
            <ChevronDown size={14} color={MUTED} style={{ transform: sizeOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
          </button>

          {sizeOpen && (
            <div
              ref={sizeMenuRef}
              style={{
                position: "absolute", bottom: "calc(100% + 6px)", [ar ? "right" : "left"]: 0,
                minWidth: 140, backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 14,
                padding: 4, boxShadow: "0 8px 24px rgba(0,0,0,0.18)", zIndex: 50,
              }}
            >
              {pageSizeOptions.map((size) => {
                const active = size === pageSize;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => { setSizeOpen(false); router.push(buildPageSizeHref!(size)); }}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                      padding: "8px 12px", borderRadius: 10, border: "none",
                      backgroundColor: active ? `color-mix(in srgb, ${PRIMARY} 12%, transparent)` : "transparent",
                      color: active ? PRIMARY : TEXT, fontSize: 13, fontWeight: active ? 700 : 400,
                      cursor: "pointer", textAlign: "start",
                    }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = dark ? "rgba(255,255,255,0.06)" : ADMIN_LIGHT.tableHead; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    <span>{size} {t.perPage}</span>
                    {active && <Check size={14} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Static placeholder reserving the exact height of AdminPagination, shown by
// skeletons so the real pagination bar's later appearance never shifts layout.
export function AdminPaginationSkeleton() {
  return <div style={{ height: 34, marginTop: 20 }} />;
}
