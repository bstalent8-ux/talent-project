"use client";

// ─── Previous Shoots + Verified Through Talents ────────────────────────────
// Two cards side by side, built to the approved reference. Real data only:
//   - Previous Shoots      → the talent's own experience entries (name + year,
//                            now also description/duration/deliveredAt/deliverable);
//                            the brand logo comes from a matching talent_brands row.
//                            A tile with any of that extra detail opens it in a
//                            modal on click — the case-study view. `verified` here
//                            is admin-set only (never the talent), same guard as
//                            POST /api/profile/complete's "experience" section.
//   - Verified Through     → talent_brands rows an admin flagged verified=true
//                            (name, logo, year collaborated) — no case-study detail,
//                            that table has no description/duration fields.
// The reference also shows a campaign type and a month under each brand; neither
// is stored, so those lines read "No content" instead of being invented. An empty
// card stays visible and says "No content".

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, X } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useSite } from "@/contexts/SiteContext";
import type { ExperienceItem, BrandItem } from "@/features/talent-profile/types";

const PURPLE = "#6C4DFF";
const VERIFIED_GREEN = "#3DB57C";

function findBrandLogo(name: string, brands: BrandItem[]): string | null {
  const match = brands.find((b) => b.logo_url && name.toLowerCase().includes(b.name.toLowerCase()));
  return match?.logo_url ?? null;
}

interface Tile {
  key: string;
  name: string;
  logo: string | null;
  verified: boolean;
  subtitle: string | null;
  date: string | null;
  /** Present only for a "shoots" tile that has real case-study detail to show. */
  detail: ExperienceItem | null;
}

export default function UgcPreviousShoots({ experience, brands, variant = "ugc" }: { experience: ExperienceItem[] | null; brands: BrandItem[]; variant?: "ugc" | "model" }) {
  const model = variant === "model";
  const phone = useIsMobile(640);
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const compact = useIsMobile(1024);
  const CARD = model ? (dark ? "var(--bg-card)" : "#FFFFFF") : (dark ? "#0D1623" : "#FFFFFF");
  const BORDER = model ? (dark ? "var(--border-subtle)" : "#E2E8F0") : (dark ? "rgba(255,255,255,0.10)" : "#E5E7EB");
  const ACCENT = model ? "#d89b37" : PURPLE;
  const TILE_BORDER = dark ? "rgba(255,255,255,0.10)" : "#E7EAF0";
  const TEXT = dark ? "#fff" : "#0F172A";
  const MUTED = dark ? "#A8B3C2" : "#64748B";
  const FAINT = dark ? "#7C8799" : "#94A3B8";
  const noContent = ar ? "لا يوجد محتوى" : "No content";
  const [shootsOpen, setShootsOpen] = useState(false);
  const [verifiedOpen, setVerifiedOpen] = useState(false);
  const [openDetail, setOpenDetail] = useState<ExperienceItem | null>(null);

  const shoots: Tile[] = (experience ?? []).map((p, i) => {
    const hasDetail = !!(p.description || p.duration || p.deliveredAt || p.deliverable);
    return {
      key: p.id ?? `s${i}`,
      name: p.name,
      logo: p.logoUrl || findBrandLogo(p.name, brands),
      verified: p.verified,
      subtitle: p.deliverable || null,
      date: p.deliveredAt || p.year || null,
      detail: hasDetail ? p : null,
    };
  });
  const verified: Tile[] = brands
    .filter((b) => b.verified)
    .map((b) => ({ key: b.id, name: b.name, logo: b.logo_url ?? null, verified: true, subtitle: null, date: b.year_collaborated ?? null, detail: null }));

  const shootCols = phone ? 2 : 4;
  const verifiedCols = phone ? 2 : 3;

  const renderTile = (t: Tile, i: number, tall: boolean) => (
    <motion.div
      key={t.key}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05 }}
      onClick={t.detail ? () => setOpenDetail(t.detail) : undefined}
      role={t.detail ? "button" : undefined}
      tabIndex={t.detail ? 0 : undefined}
      onKeyDown={t.detail ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpenDetail(t.detail); } } : undefined}
      style={{
        border: `1px solid ${TILE_BORDER}`, borderRadius: 12, padding: 14, minWidth: 0, textAlign: model ? "center" : undefined,
        backgroundColor: dark ? "rgba(255,255,255,0.02)" : "#fff", display: "flex", flexDirection: "column",
        cursor: t.detail ? "pointer" : undefined,
      }}
    >
      {t.verified && !model && (
        <span style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 4, backgroundColor: VERIFIED_GREEN, color: "#fff", borderRadius: 6, padding: "2px 7px", fontSize: 10, fontWeight: 800, letterSpacing: 0.3 }}>
          <ShieldCheck size={10} />{ar ? "موثّق" : "VERIFIED"}
        </span>
      )}
      <div style={{ height: tall ? 74 : 60, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
        {t.logo ? (
          <img src={t.logo} alt={t.name} style={{ maxHeight: tall ? 42 : 34, maxWidth: "88%", objectFit: "contain" }} />
        ) : (
          <span style={{ color: TEXT, fontSize: tall ? 20 : 16, fontWeight: 800, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{t.name}</span>
        )}
      </div>
      {!model && <div style={{ color: TEXT, fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>}
      <div style={{ color: t.subtitle ? MUTED : FAINT, fontSize: 12, marginTop: 6 }}>{t.subtitle ?? noContent}</div>
      <div style={{ color: FAINT, fontSize: 12, marginTop: 6 }}>{t.date ?? noContent}</div>
      {model && t.verified && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 10, color: "#22c55e", fontSize: 11, fontWeight: 800, letterSpacing: 0.3 }}>
          <ShieldCheck size={13} />{ar ? "موثّق" : "VERIFIED"}
        </div>
      )}
    </motion.div>
  );

  const card = (opts: {
    title: string; note?: string; items: Tile[]; cols: number; open: boolean; toggle: () => void; tall: boolean; anchor?: string;
  }) => {
    const canExpand = opts.items.length > opts.cols;
    const visible = opts.open ? opts.items : opts.items.slice(0, opts.cols);
    return (
      <section id={opts.anchor} style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: phone ? 16 : 22, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
          <h2 style={{ color: TEXT, fontSize: 17, fontWeight: 800, margin: 0 }}>
            {opts.title}
            {opts.note && <span style={{ color: MUTED, fontSize: 13, fontWeight: 500, marginInlineStart: 8 }}>{opts.note}</span>}
          </h2>
          {canExpand && (
            <button
              type="button"
              onClick={opts.toggle}
              style={{ background: "none", border: "none", padding: 0, color: ACCENT, fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0, fontFamily: "'IBM Plex Sans Arabic',sans-serif" }}
            >
              {opts.open ? (ar ? "عرض أقل" : "Show Less") : (ar ? "عرض الكل" : "View All")}
            </button>
          )}
        </div>
        {opts.items.length === 0 ? (
          <div style={{ padding: "28px 0", textAlign: "center", color: MUTED, fontSize: 14, fontWeight: 600 }}>{noContent}</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${opts.cols}, minmax(0, 1fr))`, gap: 12 }}>
            {visible.map((t, i) => renderTile(t, i, opts.tall))}
          </div>
        )}
      </section>
    );
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: compact ? "minmax(0,1fr)" : "minmax(0,1fr) minmax(0,1fr)", gap: 20, alignItems: "start" }}>
      {card({
        title: ar ? "أعمال سابقة" : "Previous Shoots", note: model ? undefined : ar ? "(رفعها المنشئ)" : "(Uploaded by Creator)",
        items: shoots, cols: shootCols, open: shootsOpen, toggle: () => setShootsOpen((o) => !o), tall: false, anchor: "ugc-shoots",
      })}
      {card({
        title: ar ? "موثّق عبر Talents" : "Verified Through Talents",
        items: verified, cols: verifiedCols, open: verifiedOpen, toggle: () => setVerifiedOpen((o) => !o), tall: true,
      })}

      {openDetail && (
        <div
          onClick={(e) => e.target === e.currentTarget && setOpenDetail(null)}
          style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
        >
          <div
            dir={ar ? "rtl" : "ltr"}
            style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 24, maxWidth: 440, width: "100%", maxHeight: "85vh", overflowY: "auto", fontFamily: "'IBM Plex Sans Arabic',sans-serif" }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
              <div style={{ minWidth: 0 }}>
                {openDetail.verified && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 8, backgroundColor: VERIFIED_GREEN, color: "#fff", borderRadius: 6, padding: "2px 7px", fontSize: 10, fontWeight: 800, letterSpacing: 0.3 }}>
                    <ShieldCheck size={10} />{ar ? "موثّق" : "VERIFIED"}
                  </span>
                )}
                <h3 style={{ color: TEXT, fontSize: 17, fontWeight: 800, margin: 0, overflowWrap: "anywhere" }}>{openDetail.name}</h3>
              </div>
              <button onClick={() => setOpenDetail(null)} aria-label={ar ? "إغلاق" : "Close"} style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 8, border: "none", background: dark ? "rgba(255,255,255,0.08)" : "#f1f5f9", color: MUTED, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={16} />
              </button>
            </div>

            {openDetail.description && (
              <p style={{ color: TEXT, fontSize: 13.5, lineHeight: 1.7, margin: "0 0 16px" }}>{openDetail.description}</p>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: ar ? "مدة التنفيذ" : "Execution duration", value: openDetail.duration },
                { label: ar ? "تاريخ التسليم" : "Delivered", value: openDetail.deliveredAt },
                { label: ar ? "اللي اتسلّم" : "Deliverable", value: openDetail.deliverable },
              ].filter((row) => row.value).map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", gap: 12, borderTop: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "#EEF2F7"}`, paddingTop: 10 }}>
                  <span style={{ color: MUTED, fontSize: 12.5, flexShrink: 0 }}>{row.label}</span>
                  <span style={{ color: TEXT, fontSize: 12.5, fontWeight: 700, textAlign: ar ? "left" : "right" }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
