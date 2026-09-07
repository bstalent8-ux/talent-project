"use client";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import type { AdminSearchResult } from "@/features/admin-roles/types";

const TX = {
  ar: { search: "دوّر بالاسم...", unassigned: "بدون تعيين" },
  en: { search: "Search by name...", unassigned: "Unassigned" },
};

interface Props {
  onPick: (admin: AdminSearchResult | null) => void;
  placeholder?: string;
  autoFocus?: boolean;
  /** Which assignee-search endpoint to hit — different features gate this
   *  differently (leads:update vs candidates:update), so each has its own
   *  route even though the query logic (searchAdmins()) is shared. */
  apiPath?: string;
}

// Debounced admin search dropdown — shared by the single-lead/candidate
// assignee picker (Detail views), the "assign this task to" field on a new
// action, and the table's bulk-assign toolbar. Deliberately dumb: it only
// reports a pick, the caller decides what to do with it (PATCH immediately
// vs. hold for a form submit).
export default function LeadAssigneePicker({ onPick, placeholder, autoFocus, apiPath = "/api/admin/leads/assignees" }: Props) {
  const { dark, lang } = useSite();
  const t = TX[lang];
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const TEXT = dark ? "#f1f5f9" : "#0f172a";
  const MUTED = dark ? "#94a3b8" : "#64748b";
  const inputStyle: React.CSSProperties = { padding: "9px 12px", borderRadius: 8, border: `1px solid ${BORDER}`, backgroundColor: "transparent", color: TEXT, fontSize: 13, width: "100%" };

  async function search(value: string) {
    const res = await fetch(`${apiPath}?q=${encodeURIComponent(value)}`).catch(() => null);
    const data = await res?.json().catch(() => null) as { admins?: AdminSearchResult[] } | null;
    setResults(data?.admins ?? []);
  }

  function onQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  }

  useEffect(() => { search(""); }, []); // preload recent admins so opening the dropdown isn't empty

  return (
    <div style={{ position: "relative" }}>
      <Search size={13} color={MUTED} style={{ position: "absolute", insetInlineStart: 10, top: 12, pointerEvents: "none" }} />
      <input
        autoFocus={autoFocus}
        style={{ ...inputStyle, paddingInlineStart: 30 }}
        placeholder={placeholder ?? t.search}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onFocus={() => { if (blurTimer.current) clearTimeout(blurTimer.current); setOpen(true); }}
        onBlur={() => { blurTimer.current = setTimeout(() => setOpen(false), 150); }}
      />
      {open && (
        <div style={{ position: "absolute", top: "100%", insetInlineStart: 0, insetInlineEnd: 0, marginTop: 4, backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, zIndex: 30, maxHeight: 220, overflowY: "auto" }}>
          <div
            onClick={() => { onPick(null); setQuery(""); setOpen(false); }}
            style={{ padding: "8px 12px", cursor: "pointer", fontSize: 12.5, color: MUTED, borderBottom: `1px solid ${BORDER}` }}
          >
            {t.unassigned}
          </div>
          {results.map((admin) => (
            <div
              key={admin.id}
              onClick={() => { onPick(admin); setQuery(admin.fullName ?? admin.handle ?? ""); setOpen(false); }}
              style={{ padding: "8px 12px", cursor: "pointer", fontSize: 12.5, color: TEXT, borderBottom: `1px solid ${BORDER}` }}
            >
              <div style={{ fontWeight: 600 }}>{admin.fullName ?? admin.handle}</div>
              {admin.adminRoleLabel && <div style={{ color: MUTED, fontSize: 11 }}>{admin.adminRoleLabel}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
