"use client";

// Port of model/components/PortfolioSection.tsx's bento grid (1 tall +
// 2 medium + up to 4 small). Handles real portfolioItems, including videos,
// without fabricating media metadata.

import { Star, Play } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import type { PortfolioItem } from "@/features/talent-profile/types";

const GOLD = "#d89b37";

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
  const { dark } = useSite();
  const CARD = dark ? "var(--bg-surface)" : "#FFFFFF";
  const BORDER = dark ? "var(--border-subtle)" : "#E2E8F0";
  const TEXT = dark ? "var(--text-primary)" : "#0F172A";
  const TILE_BG = dark ? "var(--bg-page-subtle)" : "#F1F5F9";

  if (portfolioItems.length === 0) return null;

  const [hero, med1, med2, ...rest] = portfolioItems;

  const tile = (item: PortfolioItem, index: number, aspect: string) => {
    const video = isVideoItem(item);
    return (
      <div
        key={item.id ?? index}
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
          backgroundImage: !video && item.url ? `url(${item.url})` : undefined,
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
          <div style={{ position: "absolute", bottom: 10, insetInlineEnd: 10, backgroundColor: "rgba(10,13,20,0.85)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 9px", borderRadius: 6, maxWidth: "70%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {item.caption}
          </div>
        )}
        <div style={{ position: "absolute", bottom: 10, insetInlineStart: 10 }}>
          <span style={{ width: 22, height: 22, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.6)", border: `1px solid ${GOLD}66`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {video ? <Play size={11} color={GOLD} fill={GOLD} /> : <Star size={12} color={GOLD} fill={GOLD} />}
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
