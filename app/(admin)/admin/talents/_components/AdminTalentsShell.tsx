"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import AdminShell from "@/components/admin/AdminShell";
import CustomSelect from "@/components/ui/CustomSelect";
import type { AdminTalentFilterOptions, TalentScoreOp } from "@/features/admin/services/admin.service";

const STATUS_FILTERS = ["all", "pending", "approved", "rejected", "suspended"] as const;

const TX = {
  ar: {
    title: "المواهب", all: "الكل", pending: "قيد الانتظار", approved: "معتمد", rejected: "مرفوض", suspended: "موقوف",
    filterCategory: "التصنيف: الكل", categoryUgc: "UGC", categoryModel: "Model", categoryOthers: "أخرى", filterCity: "المدينة: الكل",
    duplicateAll: "التكرار: الكل", duplicateWith: "فيه تكرار", duplicateWithout: "بدون تكرار",
    searchPlaceholder: "بحث بالاسم أو رقم الهاتف...",
    scoreAny: "السكور: الكل", scoreEq: "السكور = ", scoreLte: "السكور ≤ ", scoreGte: "السكور ≥ ",
    scorePlaceholder: "0-100",
  },
  en: {
    title: "Talents", all: "All", pending: "Pending", approved: "Approved", rejected: "Rejected", suspended: "Suspended",
    filterCategory: "Category: All", categoryUgc: "UGC", categoryModel: "Model", categoryOthers: "Others", filterCity: "City: All",
    duplicateAll: "Duplication: All", duplicateWith: "With duplication", duplicateWithout: "Without duplication",
    searchPlaceholder: "Search by name or phone...",
    scoreAny: "Score: Any", scoreEq: "Score = ", scoreLte: "Score ≤ ", scoreGte: "Score ≥ ",
    scorePlaceholder: "0-100",
  },
};

interface Props {
  status: string;
  category?: string;
  city?: string;
  duplicate?: "all" | "with" | "without";
  q?: string;
  score?: number;
  scoreOp?: TalentScoreOp;
  filterOptions: AdminTalentFilterOptions;
  children: React.ReactNode;
}

// Sidebar + topbar + status filter tabs, plus category/city filters —
// rendered immediately, never suspended. Only the table (passed as
// `children`, wrapped in <Suspense> by page.tsx) shows a skeleton while its
// page/filter combo loads.
export default function AdminTalentsShell({ status, category, city, duplicate = "all", q, score, scoreOp, filterOptions, children }: Props) {
  const { dark, lang } = useSite();
  const router = useRouter();
  const t = TX[lang];
  const MUTED = dark ? "#94a3b8" : "#64748b";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const TEXT = dark ? "#f1f5f9" : "#0f172a";

  function hrefFor(overrides: Partial<{ status: string; category: string; city: string; duplicate: string; q: string; score: number | null; scoreOp: string | null }>) {
    const next = { status, category, city, duplicate, q, score, scoreOp, ...overrides };
    const params = new URLSearchParams();
    if (next.status && next.status !== "all") params.set("status", next.status);
    if (next.category) params.set("category", next.category);
    if (next.city) params.set("city", next.city);
    if (next.duplicate && next.duplicate !== "all") params.set("duplicate", next.duplicate);
    if (next.q) params.set("q", next.q);
    if (next.scoreOp && typeof next.score === "number") { params.set("scoreOp", next.scoreOp); params.set("score", String(next.score)); }
    const qs = params.toString();
    return qs ? `/admin/talents?${qs}` : "/admin/talents";
  }

  // Local draft so typing doesn't lag behind a router.push per keystroke;
  // committed to the URL (and the server refetch it drives) 350ms after the
  // user stops typing. `q` prop stays the source of truth on navigation
  // (back/forward, another filter changing) via the sync effect below.
  const [draft, setDraft] = useState(q ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { setDraft(q ?? ""); }, [q]);

  // Score filter: operator select + 0-100 number box. Filter only applies
  // once BOTH are set; the number box is debounced like the search box.
  const [scoreDraft, setScoreDraft] = useState(typeof score === "number" ? String(score) : "");
  const scoreDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { setScoreDraft(typeof score === "number" ? String(score) : ""); }, [score]);
  // The operator lives in local state too: the URL only carries scoreOp once a
  // number exists, so driving the select/number box purely off the URL made
  // picking an operator first snap back to "Any" and hide the number box.
  const [opDraft, setOpDraft] = useState<string>(scoreOp ?? "");
  useEffect(() => { setOpDraft(scoreOp ?? ""); }, [scoreOp]);

  function onScoreChange(value: string) {
    const cleaned = value.replace(/\D/g, "").slice(0, 3);
    setScoreDraft(cleaned);
    if (scoreDebounce.current) clearTimeout(scoreDebounce.current);
    scoreDebounce.current = setTimeout(() => {
      if (cleaned === "") { router.push(hrefFor({ score: null, scoreOp: null })); return; }
      router.push(hrefFor({ score: Math.min(100, Number(cleaned)), scoreOp: opDraft || "gte" }));
    }, 400);
  }

  function onScoreOpChange(op: string) {
    setOpDraft(op);
    if (!op) { setScoreDraft(""); router.push(hrefFor({ score: null, scoreOp: null })); return; }
    // No number typed yet: nothing to filter on, just reveal the number box.
    if (scoreDraft !== "") router.push(hrefFor({ scoreOp: op, score: Math.min(100, Number(scoreDraft)) }));
  }

  function onSearchChange(value: string) {
    setDraft(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      router.push(hrefFor({ q: value || undefined }));
    }, 350);
  }

  return (
    <AdminShell title={t.title} search={draft} onSearchChange={onSearchChange} searchPlaceholder={t.searchPlaceholder}>
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
          <CustomSelect
            size="sm"
            value={category ?? ""}
            onChange={(v) => router.push(hrefFor({ category: v || undefined }))}
            style={{ width: "auto", minWidth: 140 }}
            colors={{ border: BORDER, card: CARD, text: TEXT, muted: MUTED, primary: "#00D26A", hover: dark ? "#131F2E" : "#F1F5F9" }}
            options={[
              { value: "", label: t.filterCategory },
              { value: "ugc", label: t.categoryUgc },
              { value: "model", label: t.categoryModel },
              { value: "others", label: t.categoryOthers },
            ]}
          />
          <CustomSelect
            size="sm"
            value={city ?? ""}
            onChange={(v) => router.push(hrefFor({ city: v || undefined }))}
            style={{ width: "auto", minWidth: 140 }}
            colors={{ border: BORDER, card: CARD, text: TEXT, muted: MUTED, primary: "#00D26A", hover: dark ? "#131F2E" : "#F1F5F9" }}
            options={[
              { value: "", label: t.filterCity },
              ...filterOptions.cities.map((c) => ({ value: c, label: c })),
            ]}
          />
          <CustomSelect
            size="sm"
            value={duplicate}
            onChange={(v) => router.push(hrefFor({ duplicate: v }))}
            style={{ width: "auto", minWidth: 150 }}
            colors={
              duplicate !== "all"
                ? { border: "#F4B740", card: CARD, text: "#F4B740", muted: MUTED, primary: "#F4B740", hover: dark ? "#131F2E" : "#F1F5F9" }
                : { border: BORDER, card: CARD, text: MUTED, muted: MUTED, primary: "#00D26A", hover: dark ? "#131F2E" : "#F1F5F9" }
            }
            options={[
              { value: "all", label: t.duplicateAll },
              { value: "with", label: t.duplicateWith },
              { value: "without", label: t.duplicateWithout },
            ]}
          />
          <div style={{ display: "flex", gap: 4 }}>
            <CustomSelect
              size="sm"
              value={opDraft}
              onChange={onScoreOpChange}
              style={{ width: "auto", minWidth: 120 }}
              colors={
                opDraft
                  ? { border: "#00D26A", card: CARD, text: "#00D26A", muted: MUTED, primary: "#00D26A", hover: dark ? "#131F2E" : "#F1F5F9" }
                  : { border: BORDER, card: CARD, text: MUTED, muted: MUTED, primary: "#00D26A", hover: dark ? "#131F2E" : "#F1F5F9" }
              }
              options={[
                { value: "", label: t.scoreAny },
                { value: "eq", label: t.scoreEq },
                { value: "lte", label: t.scoreLte },
                { value: "gte", label: t.scoreGte },
              ]}
            />
            {opDraft && (
              <input
                value={scoreDraft}
                onChange={(e) => onScoreChange(e.target.value)}
                inputMode="numeric"
                placeholder={t.scorePlaceholder}
                style={{ width: 64, padding: "7px 8px", borderRadius: 8, border: `1px solid ${BORDER}`, backgroundColor: CARD, color: TEXT, fontSize: 12.5, outline: "none", textAlign: "center" }}
              />
            )}
          </div>
        </div>
      </div>
      {children}
    </AdminShell>
  );
}
