"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useSite } from "@/contexts/SiteContext";
import { useIsMobile } from "@/hooks/useIsMobile";
import AdminShell from "@/components/admin/AdminShell";
import type { TalentGenderRow } from "@/features/admin/services/talent-gender.service";

type Gender = "male" | "female";
type Tab = "missing" | "all";

const TX = {
  ar: {
    title: "نوع المواهب (Male / Female)",
    intro: "فلتر Male / Female في Explore بيعتمد على الخانة دي. دوس ذكر أو أنثى جنب كل موهبة — بيتحفظ على طول.",
    missing: "من غير نوع", all: "الكل",
    male: "ذكر — Male", female: "أنثى — Female", clear: "مسح",
    done: "متحدد", of: "من",
    search: "ابحث بالاسم أو الـhandle...",
    notApproved: "مش معتمد",
    empty: "كل المواهب اتحدد نوعها 🎉",
    error: "الحفظ فشل، جرّب تاني",
    back: "← المواهب",
    cacheNote: "Explore بيتحدث خلال دقايق بعد الحفظ.",
  },
  en: {
    title: "Talent gender (Male / Female)",
    intro: "The Explore Male / Female filter reads this. Click Male or Female next to each talent — it saves right away.",
    missing: "No gender", all: "All",
    male: "Male", female: "Female", clear: "Clear",
    done: "set", of: "of",
    search: "Search by name or handle...",
    notApproved: "Not approved",
    empty: "Every talent has a gender set 🎉",
    error: "Save failed, try again",
    back: "← Talents",
    cacheNote: "Explore updates within a few minutes of saving.",
  },
};

export default function TalentGenderClient({ rows }: { rows: TalentGenderRow[] }) {
  const { dark, lang } = useSite();
  const isMobile = useIsMobile();
  const t = TX[lang];

  const CARD   = dark ? "#2B211D" : "#FBF7EA";
  const BORDER = dark ? "#3A2E28" : "#E6DCC6";
  const TEXT   = dark ? "#F5EEDB" : "#2B211D";
  const MUTED  = dark ? "#A99B8E" : "#6E5F55";
  const TEAL   = "#087F83";
  const PEACH  = "#E7A58A";

  const [genders, setGenders] = useState<Record<string, Gender | null>>(
    () => Object.fromEntries(rows.map((r) => [r.profileId, r.gender])),
  );
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const [tab, setTab]       = useState<Tab>("missing");
  const [q, setQ]           = useState("");
  // Rows set during this visit stay visible on the "missing" tab, so the list
  // doesn't jump under the admin's cursor after every click.
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const setCount = rows.filter((r) => genders[r.profileId]).length;

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (tab === "missing" && genders[r.profileId] && !touched.has(r.profileId)) return false;
      if (!needle) return true;
      return r.name.toLowerCase().includes(needle) || (r.handle ?? "").toLowerCase().includes(needle);
    });
  }, [rows, genders, tab, q, touched]);

  async function save(profileId: string, gender: Gender | null) {
    const prev = genders[profileId];
    setGenders((g) => ({ ...g, [profileId]: gender }));
    setTouched((s) => new Set(s).add(profileId));
    setSaving((s) => ({ ...s, [profileId]: true }));
    setFailed((f) => ({ ...f, [profileId]: false }));
    try {
      const res = await fetch("/api/admin/talents/gender", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, gender }),
      });
      if (!res.ok) throw new Error(String(res.status));
    } catch {
      setGenders((g) => ({ ...g, [profileId]: prev }));
      setFailed((f) => ({ ...f, [profileId]: true }));
    } finally {
      setSaving((s) => ({ ...s, [profileId]: false }));
    }
  }

  const pill = (active: boolean): React.CSSProperties => ({
    padding: "7px 16px", borderRadius: 20, cursor: "pointer", fontSize: 13,
    border: `1px solid ${active ? TEAL : BORDER}`,
    backgroundColor: active ? "rgba(8,127,131,0.1)" : "transparent",
    color: active ? "var(--color-primary-text)" : MUTED, fontWeight: active ? 700 : 400,
    fontFamily: "inherit",
  });

  const choice = (active: boolean, color: string): React.CSSProperties => ({
    minWidth: isMobile ? 0 : 110, flex: isMobile ? 1 : undefined, minHeight: 38,
    padding: "0 14px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700,
    fontFamily: "inherit",
    border: `1px solid ${active ? color : BORDER}`,
    background: active ? color : "transparent",
    color: active ? (color === PEACH ? "#2B211D" : "#FFFFFF") : TEXT,
  });

  return (
    <AdminShell title={t.title} search={q} onSearchChange={setQ} searchPlaceholder={t.search}>
      <Link href="/admin/talents" style={{ color: MUTED, fontSize: 13, textDecoration: "none" }}>{t.back}</Link>
      <p style={{ color: MUTED, fontSize: 14, margin: "10px 0 4px", lineHeight: 1.6 }}>{t.intro}</p>
      <p style={{ color: MUTED, fontSize: 12.5, margin: "0 0 16px" }}>{t.cacheNote}</p>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={() => { setTab("missing"); setTouched(new Set()); }} style={pill(tab === "missing")}>
            {t.missing} ({rows.length - setCount})
          </button>
          <button type="button" onClick={() => setTab("all")} style={pill(tab === "all")}>
            {t.all} ({rows.length})
          </button>
        </div>
        <span style={{ color: TEXT, fontSize: 13.5, fontWeight: 700 }}>
          {setCount} {t.of} {rows.length} {t.done}
        </span>
      </div>

      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
        {visible.length === 0 ? (
          <p style={{ color: MUTED, textAlign: "center", padding: 32, margin: 0 }}>{t.empty}</p>
        ) : visible.map((r, i) => {
          const g = genders[r.profileId];
          return (
            <div key={r.profileId} style={{
              display: "flex", alignItems: isMobile ? "stretch" : "center", gap: 12,
              flexDirection: isMobile ? "column" : "row",
              padding: "12px 16px", borderTop: i ? `1px solid ${BORDER}` : "none",
              opacity: saving[r.profileId] ? 0.6 : 1,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                {r.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.avatarUrl} alt="" width={48} height={48} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: BORDER, flexShrink: 0 }} />
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: TEXT, fontWeight: 700, fontSize: 14.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.handle ? (
                      <Link href={`/talent/${r.handle}`} target="_blank" style={{ color: "inherit", textDecoration: "none" }}>{r.name}</Link>
                    ) : r.name}
                  </div>
                  <div style={{ color: MUTED, fontSize: 12.5 }}>
                    {r.handle ? `@${r.handle}` : ""}{r.category ? ` · ${r.category}` : ""}
                    {r.status !== "approved" && <span style={{ color: PEACH }}> · {t.notApproved}</span>}
                  </div>
                  {failed[r.profileId] && <div role="alert" style={{ color: "var(--color-error)", fontSize: 12.5 }}>{t.error}</div>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button type="button" disabled={saving[r.profileId]} aria-pressed={g === "male"}
                  onClick={() => save(r.profileId, "male")} style={choice(g === "male", TEAL)}>{t.male}</button>
                <button type="button" disabled={saving[r.profileId]} aria-pressed={g === "female"}
                  onClick={() => save(r.profileId, "female")} style={choice(g === "female", PEACH)}>{t.female}</button>
                {g && (
                  <button type="button" disabled={saving[r.profileId]} onClick={() => save(r.profileId, null)}
                    style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 12.5, fontFamily: "inherit" }}>
                    {t.clear}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AdminShell>
  );
}
