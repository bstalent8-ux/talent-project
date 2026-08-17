"use client";
import { motion } from "framer-motion";
import { Play, Image } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useSite } from "@/contexts/SiteContext";
import type { PortfolioItem } from "@/features/talent-profile/types";

const COLORS = [
  ["#1e3a5f", "#0d2137"],
  ["#2a1a3a", "#1a0d2a"],
  ["#1a2a1a", "#0d1a0d"],
  ["#3a1a1a", "#2a0d0d"],
  ["#1a1a3a", "#0d0d2a"],
  ["#2a2a1a", "#1a1a0d"],
];

interface Props {
  portfolioItems?: PortfolioItem[];
  /** "model" swaps the 6-col/180px grid for a larger, portrait editorial one —
   * matches an image-first profile without touching the UGC layout at all. */
  variant?: "default" | "model";
}

export default function PortfolioSection({ portfolioItems, variant = "default" }: Props) {
  const isMobile = useIsMobile();
  const { dark, lang } = useSite();
  const ar = lang === "ar";
  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const GREEN = "#00D26A";
  const TEAL  = "var(--color-primary)";
  const VIOLET = "#7C3AED";
  const hasReal = portfolioItems && portfolioItems.length > 0;
  const isModel = variant === "model";

  // Previously this fell back to decorative gradient tiles, which read as real
  // work to a brand. An unfinished portfolio now shows nothing instead.
  if (!hasReal) return null;

  const tile = (item: PortfolioItem, i: number, heightPx: number) => (
    <motion.div
      key={item.id ?? i}
      whileHover={{ scale: 1.03 }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05 }}
      style={{
        position: "relative",
        height: heightPx,
        aspectRatio: isModel ? "3 / 4" : undefined,
        borderRadius: 12,
        overflow: "hidden",
        cursor: "pointer",
        background: item.url
          ? `url(${item.url}) center/cover`
          : `linear-gradient(160deg, ${COLORS[i % COLORS.length][0]}, ${COLORS[i % COLORS.length][1]})`,
        border: `1px solid ${BORDER}`,
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: isModel ? "color-mix(in srgb, var(--color-primary) 20%, transparent)" : "rgba(0,210,106,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            backgroundColor: isModel ? TEAL : GREEN,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {item.media_type === "video" ? (
            <Play size={16} color="#fff" fill="#fff" />
          ) : (
            <Image size={16} color="#fff" />
          )}
        </div>
      </motion.div>
      {item.caption && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
            padding: "20px 8px 8px",
          }}
        >
          <p style={{ color: "#fff", fontSize: 10, fontWeight: 600, margin: 0 }}>
            {item.caption}
          </p>
        </div>
      )}
    </motion.div>
  );

  // Editorial composition (Model only) — groups of 7: a row of 3 larger
  // tiles, then a row of 4 smaller ones, repeating for however many items
  // exist. Matches the reference's rhythm without a masonry/height-packing
  // algorithm — every tile keeps a real, predictable 3:4 aspect ratio.
  const editorialGroups: PortfolioItem[][] = [];
  if (isModel && !isMobile) {
    for (let i = 0; i < portfolioItems.length; i += 7) {
      editorialGroups.push(portfolioItems.slice(i, i + 7));
    }
  }

  return (
    <div
      style={{
        backgroundColor: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        padding: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h2 style={{ color: dark ? "#fff" : "#0F172A", fontSize: 18, fontWeight: 800, margin: 0 }}>
            {isModel ? (ar ? "المعرض" : "Portfolio") : (ar ? "معرض الفيديوهات" : "Video Portfolio")}
          </h2>
          <span style={{ backgroundColor: `${VIOLET}22`, color: VIOLET, fontSize: 12, fontWeight: 700, padding: "2px 9px", borderRadius: 999 }}>
            {portfolioItems!.length}
          </span>
        </div>
        <button
          style={{
            background: "none",
            border: "none",
            color: isModel ? TEAL : GREEN,
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "'Cairo',sans-serif",
          }}
        >
          {ar ? "عرض الكل ›" : "View All ›"}
        </button>
      </div>

      {isModel && !isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {editorialGroups.map((group, g) => (
            <div key={g} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {group.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(3, group.length)}, 1fr)`, gap: 16 }}>
                  {group.slice(0, 3).map((item, i) => tile(item, g * 7 + i, 360))}
                </div>
              )}
              {group.length > 3 && (
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(4, group.length - 3)}, 1fr)`, gap: 16 }}>
                  {group.slice(3, 7).map((item, i) => tile(item, g * 7 + 3 + i, 220))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "repeat(2,1fr)"
              : isModel
                ? "repeat(3,1fr)"
                : "repeat(6,1fr)",
            gap: isModel ? 16 : 12,
          }}
        >
          {(isModel ? portfolioItems : portfolioItems.slice(0, 6)).map((item, i) =>
            tile(item, i, isModel ? 260 : 180),
          )}
        </div>
      )}
    </div>
  );
}
