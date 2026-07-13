"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";

const PAGE_SIZE = 12;
import type { TalentCard } from "../page";
import ExploreHero from "./ExploreHero";
import ExploreFilters from "./ExploreFilters";
import ExploreGrid from "./ExploreGrid";
import { useSite } from "@/contexts/SiteContext";
import { createClient } from "@/lib/supabase/client";
import DirectBriefModal from "@/components/DirectBriefModal";

export type SortOption = "price_asc" | "price_desc" | "rating" | "newest";
export type ModeOption = "dark" | "light";

const TALENT_TYPES = [
  { key: "all",        label_ar: "الكل",           label_en: "All" },
  { key: "ugc",        label_ar: "مبدع محتوى UGC", label_en: "UGC Creator" },
  { key: "influencer", label_ar: "مؤثر",           label_en: "Influencer" },
  { key: "host",       label_ar: "مذيع / مقدم",    label_en: "Host / Presenter" },
  { key: "model",      label_ar: "موديل",           label_en: "Model" },
  { key: "actor",      label_ar: "ممثل",            label_en: "Actor" },
];

function matchesType(talent: TalentCard, type: string): boolean {
  if (type === "all") return true;
  // Check specialties first (most specific), then category as fallback
  const specialties = (talent.specialties ?? []).join(" ").toLowerCase();
  const category = (talent.category ?? "").toLowerCase();
  const map: Record<string, { specs: string[]; cats: string[] }> = {
    ugc:        { specs: ["ugc", "content creator", "محتوى", "مبدع", "كونتنت"], cats: ["ugc"] },
    influencer: { specs: ["مؤثر", "مؤثرة", "influencer", "تأثير"],              cats: [] },
    host:       { specs: ["مذيع", "مقدم", "مقدمة", "host", "presenter"],        cats: [] },
    model:      { specs: ["موديل", "model", "أزياء", "فاشن"],                   cats: [] },
    actor:      { specs: ["ممثل", "ممثلة", "actor", "acting", "تمثيل"],         cats: [] },
  };
  const rule = map[type];
  if (!rule) return false;
  if (rule.specs.some(kw => specialties.includes(kw))) return true;
  if (rule.cats.length && rule.cats.includes(category)) return true;
  return false;
}

interface Props { talents: TalentCard[] }

export default function ExploreClient({ talents }: Props) {
  const { lang, dark } = useSite();
  const router = useRouter();
  const [search,   setSearch]   = useState("");
  const [type,     setType]     = useState("all");
  const [sort,     setSort]     = useState<SortOption>("rating");
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [myRole,   setMyRole]   = useState<string | null>(null);
  const [myId,     setMyId]     = useState<string | null>(null);
  const [briefTarget, setBriefTarget] = useState<TalentCard | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await createClient().auth.getUser();
      if (!data.user) return;
      setMyId(data.user.id);
      const res = await fetch("/api/me/role");
      if (res.ok) { const d = await res.json(); setMyRole(d.role); }
    })();
  }, []);
  const [verified, setVerified] = useState(false);
  const [sex, setSex] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [search, type, sort, minPrice, maxPrice, verified, sex]);

  const filtered = useMemo(() => {
    let list = talents.filter(t => {
      if (search) {
        const q = search.toLowerCase();
        if (!t.name.toLowerCase().includes(q) && !(t.category ?? "").toLowerCase().includes(q)) return false;
      }
      if (!matchesType(t, type)) return false;
      if (sex !== "all" && t.gender !== sex) return false;
      if (verified && !t.verified) return false;
      if (t.starting_price !== null) {
        if (t.starting_price < minPrice || t.starting_price > maxPrice) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sort === "price_asc")  return (a.starting_price ?? 99999) - (b.starting_price ?? 99999);
      if (sort === "price_desc") return (b.starting_price ?? 0)     - (a.starting_price ?? 0);
      if (sort === "rating")     return b.rating - a.rating;
      return 0;
    });

    return list;
  }, [talents, search, type, sort, minPrice, maxPrice, verified, sex]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const GREEN  = "#00D26A";
  const BORDER = dark ? "rgba(0,255,163,0.1)" : "#e2e8f0";

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: dark ? "#050B12" : "#F1F5F9",
      fontFamily: "'Cairo', sans-serif",
      direction: lang === "ar" ? "rtl" : "ltr",
    }}>
      <ExploreHero
        dark={dark} lang={lang} search={search} onSearch={setSearch}
        types={TALENT_TYPES} activeType={type} onTypeChange={setType}
        resultCount={filtered.length}
      />

      <div style={{
        maxWidth: 1440, margin: "0 auto",
        padding: "24px 24px 60px",
        display: "grid",
        gridTemplateColumns: "240px 1fr",
        alignItems: "start",
        gap: 20,
      }}>
        <ExploreFilters
          dark={dark} lang={lang}
          sort={sort} onSort={setSort}
          minPrice={minPrice} maxPrice={maxPrice}
          onMinPrice={setMinPrice} onMaxPrice={setMaxPrice}
          verified={verified} onVerified={setVerified}
          sex={sex} onSexChange={setSex}
          types={TALENT_TYPES} activeType={type} onTypeChange={setType}
        />
        <div>
          <ExploreGrid
            dark={dark} lang={lang} talents={paginated}
            myRole={myRole} myId={myId}
            onSendBrief={(t) => setBriefTarget(t)}
          />
          {briefTarget && (
            <DirectBriefModal
              talentUserId={briefTarget.id}
              talentName={briefTarget.name}
              talentAvatar={briefTarget.avatar_url}
              talentCategory={briefTarget.category}
              dark={dark} lang={lang}
              onClose={() => setBriefTarget(null)}
              onSuccess={(bookingId) => { setBriefTarget(null); router.push(`/bookings/${bookingId}`); }}
            />
          )}

          {totalPages > 1 && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 8, marginTop: 32, flexWrap: "wrap",
            }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: "8px 18px", borderRadius: 10,
                  border: `1px solid ${BORDER}`,
                  backgroundColor: "transparent",
                  color: page === 1 ? "#64748b" : (dark ? "#fff" : "#0f172a"),
                  fontSize: 13, fontWeight: 700,
                  cursor: page === 1 ? "default" : "pointer",
                  fontFamily: "'Cairo',sans-serif", opacity: page === 1 ? 0.4 : 1,
                }}
              >
                {lang === "ar" ? "→ السابق" : "← Prev"}
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: 36, height: 36, borderRadius: 8,
                    border: `1px solid ${p === page ? GREEN : BORDER}`,
                    backgroundColor: p === page ? GREEN : "transparent",
                    color: p === page ? "#000" : (dark ? "#94a3b8" : "#64748b"),
                    fontSize: 13, fontWeight: p === page ? 900 : 400,
                    cursor: "pointer", fontFamily: "'Cairo',sans-serif",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: "8px 18px", borderRadius: 10,
                  border: `1px solid ${BORDER}`,
                  backgroundColor: "transparent",
                  color: page === totalPages ? "#64748b" : (dark ? "#fff" : "#0f172a"),
                  fontSize: 13, fontWeight: 700,
                  cursor: page === totalPages ? "default" : "pointer",
                  fontFamily: "'Cairo',sans-serif", opacity: page === totalPages ? 0.4 : 1,
                }}
              >
                {lang === "ar" ? "← التالي" : "Next →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
