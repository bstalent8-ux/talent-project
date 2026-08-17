"use client";

// Port of model/components/PortfolioSection.tsx's bento grid (1 tall +
// 2 medium + up to 4 small). Source hardcodes exactly 7 fixed-position
// items; this handles any real portfolioItems length (including 1-6 items
// or 8+, laid out in additional rows of the same small-tile pattern) so it
// never reads real talents' data past what they've actually uploaded.

import { Star, Maximize2, Play } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import type { PortfolioItem } from "@/features/talent-profile/types";

const GOLD = "#d89b37";

interface Props {
  portfolioItems: PortfolioItem[];
  onOpenGallery: (index: number) => void;
}

export default function ModelPortfolioBento({ portfolioItems, onOpenGallery }: Props) {
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = dark ? "var(--bg-surface)" : "#FFFFFF";
  const BORDER = dark ? "var(--border-subtle)" : "#E2E8F0";
  const TEXT = dark ? "var(--text-primary)" : "#0F172A";
  const TILE_BG = dark ? "var(--bg-page-subtle)" : "#F1F5F9";

  if (portfolioItems.length === 0) return null;

  const [hero, med1, med2, ...rest] = portfolioItems;

  const tile = (item: PortfolioItem, index: number, aspect: string) => (
    <div
      key={item.id ?? index}
      onClick={() => onOpenGallery(index)}
      style={{
        position: "relative", borderRadius: 12, overflow: "hidden", cursor: "pointer",
        backgroundColor: TILE_BG, border: `1px solid ${BORDER}`, aspectRatio: aspect,
        backgroundImage: item.media_type !== "video" && item.url ? `url(${item.url})` : undefined,
        backgroundSize: "cover", backgroundPosition: "center",
      }}
    >
      {item.media_type === "video" && item.url && (
        <video src={item.url} muted playsInline preload="metadata" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      )}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent 55%)" }} />
      {item.caption && (
        <div style={{ position: "absolute", bottom: 10, insetInlineEnd: 10, backgroundColor: "rgba(10,13,20,0.85)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 9px", borderRadius: 6, maxWidth: "70%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.caption}
        </div>
      )}
      <div style={{ position: "absolute", bottom: 10, insetInlineStart: 10 }}>
        <span style={{ width: 22, height: 22, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.6)", border: `1px solid ${GOLD}66`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {item.media_type === "video" ? <Play size={11} color={GOLD} fill={GOLD} /> : <Star size={12} color={GOLD} fill={GOLD} />}
        </span>
      </div>
    </div>
  );

  return (
    <div style={{ width: "100%", backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h2 style={{ color: TEXT, fontSize: 17, fontWeight: 800, margin: 0 }}>Portfolio</h2>
          <span style={{ backgroundColor: dark ? "var(--bg-card-muted)" : "#F1F5F9", color: GOLD, border: `1px solid ${GOLD}4d`, fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>{portfolioItems.length}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 12 }}>
        <div style={{ gridColumn: "span 12 / span 12" }} className="model-bento-hero">
          {hero && tile(hero, 0, "3 / 4")}
        </div>

        {(med1 || med2 || rest.length > 0) && (
          <div style={{ gridColumn: "span 12 / span 12", display: "flex", flexDirection: "column", gap: 12 }} className="model-bento-right">
            {(med1 || med2) && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {med1 && tile(med1, 1, "4 / 3")}
                {med2 && tile(med2, 2, "4 / 3")}
              </div>
            )}

            {rest.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12 }}>
                {rest.map((item, i) => tile(item, i + 3, "1 / 1"))}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @media (min-width: 768px) {
          .model-bento-hero { grid-column: span 4 / span 4 !important; }
          .model-bento-right { grid-column: span 8 / span 8 !important; }
        }
      `}</style>
    </div>
  );
}
