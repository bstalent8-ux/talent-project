"use client";

// Bento layout: 1 tall hero on the left, spanning the combined height of two
// stacked rows on the right — row 1 has 2 tiles, row 2 has 4 tiles. Anything
// past the first 7 stays hidden until "View All". Handles real
// portfolioItems, including videos, without fabricating media metadata.

import { useState } from "react";
import { Star, Play, Plus } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import { cdnImage } from "@/lib/images";
import type { PortfolioItem } from "@/features/talent-profile/types";

const GOLD = "#d89b37";
const ROW1_COUNT = 2;
const ROW2_COUNT = 4;

interface Props {
  portfolioItems: PortfolioItem[];
  onOpenGallery: (index: number) => void;
}

function isVideoItem(item: PortfolioItem): boolean {
  return item.media_type?.toLowerCase() === "video";
}

function videoPreviewSrc(url: string | null): string | undefined {
  if (!url) return undefined;
  if (url.includes("#t=")) return url;
  return `${url}#t=0.1`;
}

function cloudinaryVideoPoster(url: string | null): string | undefined {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/video/upload/")) return undefined;
  const [beforeHash] = url.split("#");
  const [withoutQuery] = beforeHash.split("?");
  const marker = "/video/upload/";
  const markerIndex = withoutQuery.indexOf(marker);
  if (markerIndex === -1) return undefined;

  const prefix = withoutQuery.slice(0, markerIndex + marker.length);
  const publicId = withoutQuery.slice(markerIndex + marker.length).replace(/\.[a-z0-9]+$/i, ".jpg");
  return `${prefix}so_0.5,f_jpg,q_auto,w_900/${publicId}`;
}

export default function ModelPortfolioBento({ portfolioItems, onOpenGallery }: Props) {
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = dark ? "var(--bg-surface)" : "#FFFFFF";
  const BORDER = dark ? "var(--border-subtle)" : "#E2E8F0";
  const TEXT = dark ? "var(--text-primary)" : "#0F172A";
  const TILE_BG = dark ? "var(--bg-page-subtle)" : "#F1F5F9";
  const [expanded, setExpanded] = useState(false);

  if (portfolioItems.length === 0) return null;

  const [hero, ...rest] = portfolioItems;
  const row1 = rest.slice(0, ROW1_COUNT);
  const row2 = rest.slice(ROW1_COUNT, ROW1_COUNT + ROW2_COUNT);
  const moreItems = rest.slice(ROW1_COUNT + ROW2_COUNT);
  const visibleMore = expanded ? moreItems : [];

  // A row that isn't full keeps its column count and pads with quiet empty slots,
  // so a lone last photo never stretches across the whole row.
  const emptySlot = (key: string, aspect: string) => (
    <div
      key={key}
      aria-hidden="true"
      style={{ borderRadius: 12, aspectRatio: aspect, backgroundColor: TILE_BG, border: `1px dashed ${BORDER}`, opacity: 0.45 }}
    />
  );

  const tile = (item: PortfolioItem, index: number, aspect: string, renderWidth: number, extraClassName?: string) => {
    const video = isVideoItem(item);
    return (
      <div
        key={item.id ?? index}
        className={extraClassName}
        onClick={() => onOpenGallery(index)}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpenGallery(index);
          }
        }}
        style={{
          position: "relative", borderRadius: 12, overflow: "hidden", cursor: "pointer",
          backgroundColor: TILE_BG, border: `1px solid ${BORDER}`, aspectRatio: aspect,
          backgroundImage: !video && item.url ? `url(${cdnImage(item.url, renderWidth)})` : undefined,
          backgroundSize: "cover", backgroundPosition: "center",
        }}
      >
        {video && item.url && (
          <video
            src={videoPreviewSrc(item.url)}
            poster={cloudinaryVideoPoster(item.url)}
            muted
            playsInline
            preload="auto"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent 55%)" }} />
        {video && (
          <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 44, height: 44, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.58)", border: "1px solid rgba(255,255,255,0.24)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(0,0,0,0.28)" }}>
            <Play size={18} color="#FFFFFF" fill="#FFFFFF" style={{ marginInlineStart: 2 }} />
          </span>
        )}
        {item.caption && (
          <div style={{ position: "absolute", bottom: 10, insetInlineStart: 10, display: "flex", alignItems: "center", gap: 5, backgroundColor: "rgba(10,13,20,0.85)", border: "1px solid rgba(255,255,255,0.14)", color: "#fff", fontSize: 11.5, fontWeight: 700, padding: "4px 10px", borderRadius: 6, maxWidth: "calc(100% - 52px)" }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.caption}</span>
            {index === 0 && <Plus size={12} color={GOLD} />}
          </div>
        )}
        <div style={{ position: "absolute", bottom: 10, insetInlineEnd: 10 }}>
          <span style={{ width: 26, height: 26, borderRadius: "50%", backgroundColor: "rgba(10,13,20,0.72)", border: `1px solid ${GOLD}66`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {video ? <Play size={12} color={GOLD} fill={GOLD} /> : <Star size={13} color={GOLD} fill={GOLD} />}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ width: "100%", backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h2 style={{ color: TEXT, fontSize: 17, fontWeight: 800, margin: 0 }}>Portfolio</h2>
          <span style={{ backgroundColor: dark ? "var(--bg-card-muted)" : "#F1F5F9", color: GOLD, border: `1px solid ${GOLD}4d`, fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>{portfolioItems.length}</span>
        </div>
        {moreItems.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            style={{ background: "none", border: "none", color: GOLD, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'IBM Plex Sans Arabic',sans-serif" }}
          >
            {expanded ? (ar ? "عرض أقل" : "Show Less") : (ar ? "عرض الكل ›" : "View All ›")}
          </button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }} className={`model-bento-top${row1.length > 0 || row2.length > 0 ? "" : " model-bento-solo"}`}>
        {hero && (
          <div className="model-bento-hero-wrap">
            {tile(hero, 0, "3 / 4", 560, "model-bento-hero-tile")}
          </div>
        )}

        {(row1.length > 0 || row2.length > 0) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }} className="model-bento-right">
            {row1.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${ROW1_COUNT}, minmax(0, 1fr))`, gap: 12 }}>
                {row1.map((item, i) => tile(item, i + 1, "4 / 3", 380))}
                {Array.from({ length: ROW1_COUNT - row1.length }, (_, i) => emptySlot(`e1-${i}`, "4 / 3"))}
              </div>
            )}
            {row2.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${ROW2_COUNT}, minmax(0, 1fr))`, gap: 12 }}>
                {row2.map((item, i) => tile(item, i + 1 + ROW1_COUNT, "1 / 1", 220))}
                {Array.from({ length: ROW2_COUNT - row2.length }, (_, i) => emptySlot(`e2-${i}`, "1 / 1"))}
              </div>
            )}
          </div>
        )}
      </div>

      {visibleMore.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12, marginTop: 12 }}>
          {visibleMore.map((item, i) => tile(item, i + 1 + ROW1_COUNT + ROW2_COUNT, "1 / 1", 260))}
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .model-bento-top {
            display: grid !important;
            grid-template-columns: minmax(0, 34fr) minmax(0, 66fr) !important;
          }
          .model-bento-hero-wrap { grid-column: 1 / span 1; }
          .model-bento-top:not(.model-bento-solo) .model-bento-hero-tile { aspect-ratio: auto !important; height: 100% !important; }
          /* One photo only: nothing to stretch against, so the tile keeps its 3:4 ratio
             (height:100% of a row with no other content collapsed it to a 2px line). */
          .model-bento-solo { grid-template-columns: minmax(0, 1fr) !important; }
          .model-bento-solo .model-bento-hero-wrap { max-width: 360px; }
          .model-bento-right { grid-column: 2 / span 1; }
        }
      `}</style>
    </div>
  );
}
