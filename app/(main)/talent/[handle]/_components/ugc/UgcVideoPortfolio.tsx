"use client";

// Port of ugc/untitled/components/VideoPortfolio.tsx — 9:16 vertical grid,
// play overlay, hover scale. Dropped vs. source: category filter chips,
// hook-rate tag, duration badge, view count — portfolio_items has no
// category/hook-rate/duration/views fields, so none of that is real.
// The play-overlay click opens a real lightbox (item.url / item.media_type
// / item.caption only) instead of the source's fake-metric video modal.

import { motion } from "framer-motion";
import { Play, ImageIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useSite } from "@/contexts/SiteContext";
import type { PortfolioItem } from "@/features/talent-profile/types";

const VIOLET = "#16a3a3"; // site --color-accent, was violet

interface Props {
  portfolioItems: PortfolioItem[];
  onSelectVideo: (item: PortfolioItem) => void;
}

export default function UgcVideoPortfolio({ portfolioItems, onSelectVideo }: Props) {
  const isMobile = useIsMobile();
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const TEXT = dark ? "#fff" : "#0F172A";
  const MUTED = dark ? "#A8B3C2" : "#64748B";

  if (portfolioItems.length === 0) return null;

  return (
    <section id="ugc-portfolio" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: isMobile ? 16 : 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h2 style={{ color: TEXT, fontSize: 18, fontWeight: 800, margin: 0 }}>{ar ? "معرض نماذج الفيديوهات" : "Video Portfolio"}</h2>
          <p style={{ color: MUTED, fontSize: 12, margin: "4px 0 0" }}>
            {ar ? "أعمال حقيقية بصيغة رأسية 9:16" : "Real 9:16 vertical UGC work"}
          </p>
        </div>
        <span style={{ color: VIOLET, fontSize: 13, fontWeight: 800 }}>{portfolioItems.length}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(5,1fr)", gap: 12 }}>
        {portfolioItems.map((item, i) => (
          <motion.div
            key={item.id ?? i}
            whileHover={{ scale: 1.03 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => onSelectVideo(item)}
            style={{
              position: "relative", aspectRatio: "9 / 16", borderRadius: 14, overflow: "hidden",
              cursor: "pointer", border: `1px solid ${BORDER}`, backgroundColor: "#0B0F19",
              backgroundImage: item.media_type !== "video" && item.url ? `url(${item.url})` : undefined,
              backgroundSize: "cover", backgroundPosition: "center",
            }}
          >
            {item.media_type === "video" && item.url && (
              <video src={item.url} muted playsInline preload="metadata" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            )}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(to top, rgba(2,6,23,0.75), transparent 55%)` }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", backgroundColor: `${VIOLET}CC`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {item.media_type === "video" ? <Play size={16} color="#fff" fill="#fff" /> : <ImageIcon size={16} color="#fff" />}
              </div>
            </div>
            {item.caption && (
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "18px 8px 8px", background: "linear-gradient(to top, rgba(2,6,23,0.9), transparent)" }}>
                <p style={{ color: "#fff", fontSize: 10, fontWeight: 600, margin: 0 }}>{item.caption}</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
