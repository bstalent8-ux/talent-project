"use client";
import { useSite } from "@/contexts/SiteContext";

interface Props {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}

export default function Pagination({ page, totalPages, onPage }: Props) {
  const { lang } = useSite();
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const t = { prev: lang === "ar" ? "السابق" : "Prev", next: lang === "ar" ? "التالي" : "Next" };

  const btn = (label: string, active: boolean, disabled: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "6px 14px", borderRadius: "var(--radius-sm)",
        border: `1px solid ${active ? "var(--color-primary)" : "var(--border-subtle)"}`,
        backgroundColor: active ? "var(--color-primary)" : "transparent",
        color: active ? "var(--color-primary-ink)" : disabled ? "var(--text-muted)" : "var(--text-primary)",
        cursor: disabled ? "not-allowed" : "pointer", fontSize: 13, fontWeight: active ? 700 : 400,
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>
      {btn(t.prev, false, page === 1, () => onPage(page - 1))}
      {pages.map(p => <span key={p}>{btn(String(p), p === page, false, () => onPage(p))}</span>)}
      {btn(t.next, false, page === totalPages, () => onPage(page + 1))}
    </div>
  );
}
