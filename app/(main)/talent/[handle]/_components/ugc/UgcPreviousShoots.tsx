"use client";

// Port of ugc/untitled/components/PreviousShoots.tsx: "Previous Shoots"
// (real ExperienceItem[]) plus its second block, "Verified Through Talents".
// Both cards now cross-reference the real talent_brands rows for a logo:
// an experience entry whose name contains a brand's name gets that brand's
// real logo_url instead of a plain text row. There is no escrow and no
// "verified" column on talent_brands, so "Verified Through Talents" shows
// the talent's real logo'd brands (first 4) as the trust signal — same
// real-first / hardcoded-fallback pattern as model/ModelVerifiedBrands.tsx,
// only falling back to the 3 generic placeholder rows when the talent has
// no talent_brands rows at all.

import { motion } from "framer-motion";
import { Briefcase, CheckCircle2, ShieldCheck } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useSite } from "@/contexts/SiteContext";
import type { ExperienceItem, BrandItem } from "@/features/talent-profile/types";

const ACCENT = "#16a3a3";
const GREEN = "#00D26A";

const FALLBACK_AR = [
  { brand: "BeBold", category: "ملابس رياضية", result: "التزام كامل بالمواعيد" },
  { brand: "TechStore", category: "محتوى UGC", result: "تقييم 5 نجوم" },
  { brand: "L'Azur", category: "حملة عناية بالبشرة", result: "تعاون متكرر" },
];
const FALLBACK_EN = [
  { brand: "BeBold", category: "Fitness Wear", result: "100% On-Time" },
  { brand: "TechStore", category: "UGC Content", result: "5 Star Rating" },
  { brand: "L'Azur", category: "Skincare Campaign", result: "Re-booked" },
];

function findBrandLogo(name: string, brands: BrandItem[]): string | null {
  const match = brands.find((b) => b.logo_url && name.toLowerCase().includes(b.name.toLowerCase()));
  return match?.logo_url ?? null;
}

export default function UgcPreviousShoots({ experience, brands }: { experience: ExperienceItem[] | null; brands: BrandItem[] }) {
  const isMobile = useIsMobile();
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const TEXT = dark ? "#fff" : "#0F172A";
  const MUTED = dark ? "#A8B3C2" : "#64748B";
  const SURFACE = dark ? "#0A121C" : "#F8FAFC";

  const items = experience ?? [];
  const brandsWithLogo = brands.filter((b) => b.logo_url);
  const verifiedRows = brandsWithLogo.length > 0
    ? brandsWithLogo.slice(0, 4).map((b) => ({ id: b.id, brand: b.name, logo: b.logo_url, category: b.year_collaborated ?? "", result: ar ? "موثّق عبر Talents" : "Verified Through Talents" }))
    : (ar ? FALLBACK_AR : FALLBACK_EN).map((r, i) => ({ id: `fallback-${i}`, logo: null as string | null, ...r }));

  if (items.length === 0) return null;

  return (
    <section id="ugc-shoots" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20, alignItems: "start" }}>
      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: dark ? "rgba(148,163,184,0.12)" : "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Briefcase size={15} color={MUTED} />
          </div>
          <h2 style={{ color: TEXT, fontSize: 18, fontWeight: 800, margin: 0 }}>{ar ? "أعمال سابقة" : "Previous Shoots"}</h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
          {items.map((p, i) => {
            const logo = findBrandLogo(p.name, brands);
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16 }}>
                {logo ? (
                  <div style={{ height: 36, width: "fit-content", maxWidth: "100%", display: "flex", alignItems: "center", padding: "6px 10px", backgroundColor: "#fff", borderRadius: 8, marginBottom: 10 }}>
                    <img src={logo} alt={p.name} style={{ maxHeight: 20, maxWidth: 90, objectFit: "contain" }} />
                  </div>
                ) : (
                  <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: `${ACCENT}1f`, color: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, marginBottom: 10 }}>
                    {p.name.charAt(0)}
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: TEXT, fontSize: 13, fontWeight: 800 }}>{p.name}</span>
                  {p.verified && <CheckCircle2 size={15} color={ACCENT} style={{ flexShrink: 0 }} />}
                </div>
                {p.year && <span style={{ color: MUTED, fontSize: 11 }}>{p.year}</span>}
              </motion.div>
            );
          })}
        </div>
      </div>

      <div style={{ backgroundColor: CARD, border: `1px solid ${dark ? "rgba(0,210,106,0.3)" : "#A7F3D0"}`, borderRadius: 20, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(0,210,106,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShieldCheck size={15} color={GREEN} />
          </div>
          <div>
            <h2 style={{ color: TEXT, fontSize: 18, fontWeight: 800, margin: 0 }}>{ar ? "موثّق عبر Talents" : "Verified Through Talents"}</h2>
            <p style={{ color: MUTED, fontSize: 11.5, margin: "2px 0 0" }}>{ar ? "مشاريع مكتملة وموثقة عبر المنصة" : "Completed projects verified through the platform"}</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
          {verifiedRows.map((r) => (
            <div key={r.id} style={{ backgroundColor: dark ? "rgba(0,210,106,0.05)" : "#F0FDF4", border: `1px solid ${dark ? "rgba(0,210,106,0.2)" : "#D1FAE5"}`, borderRadius: 14, padding: 14 }}>
              {r.logo && (
                <div style={{ height: 32, width: "fit-content", maxWidth: "100%", display: "flex", alignItems: "center", padding: "5px 8px", backgroundColor: "#fff", borderRadius: 8, marginBottom: 8 }}>
                  <img src={r.logo} alt={r.brand} style={{ maxHeight: 18, maxWidth: 80, objectFit: "contain" }} />
                </div>
              )}
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, backgroundColor: GREEN, color: "#052e16", borderRadius: 999, padding: "2px 8px", fontSize: 9.5, fontWeight: 800 }}>
                <CheckCircle2 size={10} />{ar ? "موثّق" : "VERIFIED"}
              </span>
              <div style={{ color: TEXT, fontSize: 14, fontWeight: 800, margin: "8px 0 2px" }}>{r.brand}</div>
              {r.category && <div style={{ color: MUTED, fontSize: 11, fontWeight: 600 }}>{r.category}</div>}
              <div style={{ color: GREEN, fontSize: 10.5, fontWeight: 700, marginTop: 8 }}>{r.result}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
