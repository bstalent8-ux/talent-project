"use client";

// ─── Video Portfolio ───────────────────────────────────────────────────────
// Card matching the approved reference: "Video Portfolio" + "View All" header,
// a row of 5 portrait tiles (translucent play button, duration pill), and the
// clip's title under each tile. Real data only:
//   - title  → portfolio_items.caption, "No content" when the clip has none
//   - length → read from the video's own metadata in the browser
//   - views  → not stored anywhere, so that line isn't rendered
// No portfolio at all → the card stays and says "No content".

import { useState } from "react";
import { motion } from "framer-motion";
import { Play, ImageIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useSite } from "@/contexts/SiteContext";
import { cdnImage } from "@/lib/images";
import type { PortfolioItem } from "@/features/talent-profile/types";

const PURPLE = "var(--color-primary-text)";

function videoPoster(url: string | null): string | undefined {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/video/upload/")) return undefined;
  const [withoutQuery] = url.split("#")[0].split("?");
  const marker = "/video/upload/";
  const at = withoutQuery.indexOf(marker);
  if (at === -1) return undefined;
  const prefix = withoutQuery.slice(0, at + marker.length);
  const publicId = withoutQuery.slice(at + marker.length).replace(/\.[a-z0-9]+$/i, ".jpg");
  return `${prefix}so_0.5,f_jpg,q_auto,w_360/${publicId}`;
}

function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

interface Props {
  portfolioItems: PortfolioItem[];
  onSelectVideo: (item: PortfolioItem) => void;
}

function Tile({ item, index, onSelect, TEXT, MUTED, noContent }: {
  item: PortfolioItem; index: number; onSelect: (item: PortfolioItem) => void; TEXT: string; MUTED: string; noContent: string;
}) {
  const video = item.media_type?.toLowerCase() === "video";
  const [duration, setDuration] = useState<number | null>(null);
  const src = video ? videoPoster(item.url) : item.url ? cdnImage(item.url, 360) : undefined;
  const title = item.caption?.trim();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      style={{ minWidth: 0 }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(item)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(item); } }}
        style={{
          position: "relative", aspectRatio: "3 / 4", borderRadius: 14, overflow: "hidden", cursor: "pointer",
          backgroundColor: "#2B211D", backgroundImage: src ? `url(${src})` : undefined, backgroundSize: "cover", backgroundPosition: "center",
        }}
      >
        {video && item.url && (
          <video
            src={item.url}
            preload="metadata"
            muted
            playsInline
            onLoadedMetadata={(e) => { const d = e.currentTarget.duration; if (Number.isFinite(d)) setDuration(d); }}
            style={{ display: "none" }}
          />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(27,19,16,0.35), transparent 50%)" }} />
        <span style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 34, height: 34, borderRadius: "50%",
          backgroundColor: "rgba(255,255,255,0.28)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {video ? <Play size={14} color="#fff" fill="#fff" /> : <ImageIcon size={14} color="#fff" />}
        </span>
        {video && duration !== null && (
          <span style={{ position: "absolute", bottom: 8, insetInlineEnd: 8, padding: "2px 7px", borderRadius: 8, backgroundColor: "rgba(27,19,16,0.72)", color: "#fff", fontSize: 11, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
            {formatDuration(duration)}
          </span>
        )}
      </div>
      <div style={{ marginTop: 10, fontSize: 13.5, fontWeight: 600, color: title ? TEXT : MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {title || noContent}
      </div>
    </motion.div>
  );
}

export default function UgcVideoPortfolio({ portfolioItems, onSelectVideo }: Props) {
  const phone = useIsMobile(640);
  const compact = useIsMobile(1024);
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = dark ? "#2B211D" : "#FBF7EA";
  const BORDER = dark ? "rgba(255,255,255,0.10)" : "#E6DCC3";
  const TEXT = dark ? "#fff" : "#2B211D";
  const MUTED = dark ? "#A99B8E" : "#6E5F55";
  const [expanded, setExpanded] = useState(false);

  const cols = phone ? 2 : compact ? 3 : 5;
  const initialCount = phone ? 4 : cols;
  const canExpand = portfolioItems.length > initialCount;
  const visible = expanded ? portfolioItems : portfolioItems.slice(0, initialCount);
  const noContent = ar ? "لا يوجد محتوى" : "No content";

  return (
    <section id="ugc-portfolio" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: phone ? 16 : 22, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
        <h2 style={{ color: TEXT, fontSize: 17, fontWeight: 800, margin: 0 }}>{ar ? "معرض الفيديوهات" : "Video Portfolio"}</h2>
        {canExpand && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            style={{ background: "none", border: "none", padding: 0, color: PURPLE, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'IBM Plex Sans Arabic',sans-serif" }}
          >
            {expanded ? (ar ? "عرض أقل" : "Show Less") : (ar ? "عرض الكل" : "View All")}
          </button>
        )}
      </div>

      {portfolioItems.length === 0 ? (
        <div style={{ padding: "28px 0", textAlign: "center", color: MUTED, fontSize: 14, fontWeight: 600 }}>{noContent}</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, columnGap: phone ? 12 : 14, rowGap: 18 }}>
          {visible.map((item, i) => (
            <Tile key={item.id ?? i} item={item} index={i} onSelect={onSelectVideo} TEXT={TEXT} MUTED={MUTED} noContent={noContent} />
          ))}
        </div>
      )}
    </section>
  );
}
