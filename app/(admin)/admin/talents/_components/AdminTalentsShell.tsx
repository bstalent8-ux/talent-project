"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import AdminShell from "@/components/admin/AdminShell";
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
          <select
            value={category ?? ""}
            onChange={(e) => router.push(hrefFor({ category: e.target.value || undefined }))}
            style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${BORDER}`, backgroundColor: CARD, color: category ? TEXT : MUTED, fontSize: 12.5, cursor: "pointer" }}
          >
            <option value="">{t.filterCategory}</option>
            <option value="ugc">{t.categoryUgc}</option>
            <option value="model">{t.categoryModel}</option>
            <option value="others">{t.categoryOthers}</option>
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
          <div style={{ display: "flex", gap: 4 }}>
            <select
              value={opDraft}
              onChange={(e) => onScoreOpChange(e.target.value)}
              style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${opDraft ? "#00D26A" : BORDER}`, backgroundColor: CARD, color: opDraft ? "#00D26A" : MUTED, fontSize: 12.5, cursor: "pointer", fontWeight: opDraft ? 700 : 400 }}
            >
              <option value="">{t.scoreAny}</option>
              <option value="eq">{t.scoreEq}</option>
              <option value="lte">{t.scoreLte}</option>
              <option value="gte">{t.scoreGte}</option>
            </select>
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
