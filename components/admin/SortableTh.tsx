"use client";
import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";

// Shared sortable table header for the admin list tables. Each table:
//   1. keeps a { headerKey: dbColumn } map,
//   2. reads its current sort/dir from searchParams (parseSortParam below),
//   3. renders <SortableTh> per column with an onSort that navigates.
// The actual sorting is server-side in each feature's fetch*Page().

interface Props {
  label: string;
  /** The db column this header sorts on. */
  col: string;
  activeCol?: string;
  activeDir?: "asc" | "desc";
  onSort: (col: string, dir: "asc" | "desc") => void;
  align?: "start" | "center";
}

export default function SortableTh({ label, col, activeCol, activeDir, onSort, align = "start" }: Props) {
  const { dark, lang } = useSite();
  const ar = lang === "ar";
  const MUTED = dark ? "#94a3b8" : "#64748b";
  const TEXT = dark ? "#f1f5f9" : "#0f172a";
  const TH = dark ? "#0a121c" : "#f8fafc";
  const BORDER = dark ? "#1e293b" : "#e2e8f0";
  const active = activeCol === col;

  return (
    <th
      onClick={() => onSort(col, active && activeDir === "asc" ? "desc" : "asc")}
      style={{
        padding: "10px 14px", fontSize: 12, fontWeight: 600,
        textAlign: align === "center" ? "center" : (ar ? "right" : "left"),
        backgroundColor: TH, borderBottom: `1px solid ${BORDER}`,
        whiteSpace: "nowrap", cursor: "pointer", userSelect: "none",
        color: active ? TEXT : MUTED,
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, justifyContent: align === "center" ? "center" : undefined }}>
        {label}
        {active
          ? (activeDir === "desc" ? <ChevronDown size={13} /> : <ChevronUp size={13} />)
          : <ChevronsUpDown size={12} style={{ opacity: 0.4 }} />}
      </span>
    </th>
  );
}

/** Reads `?sort=&dir=` from a Next searchParams bag. `dir` defaults to asc. */
export function parseSortParam(
  sp: Record<string, string | string[] | undefined>,
  allowed: readonly string[],
): { sort?: string; dir: "asc" | "desc" } {
  const sort = typeof sp.sort === "string" && allowed.includes(sp.sort) ? sp.sort : undefined;
  const dir = sp.dir === "desc" ? "desc" : "asc";
  return { sort, dir };
}
