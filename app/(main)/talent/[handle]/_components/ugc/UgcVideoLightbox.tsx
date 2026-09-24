"use client";

// Real replacement for ugc/untitled/components/VideoModal.tsx. The source
// modal shows fabricated hook-rate/views/brand/script-breakdown fields —
// none of that exists on portfolio_items, so this only ever renders the
// real url/media_type/caption.

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import { cdnImage } from "@/lib/images";
import type { PortfolioItem } from "@/features/talent-profile/types";

interface Props {
  item: PortfolioItem | null;
  onClose: () => void;
}

export default function UgcVideoLightbox({ item, onClose }: Props) {
  const { dark } = useSite();
  const BORDER = dark ? "rgba(79,167,163,0.15)" : "#E6DCC3";

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: "rgba(27,19,16,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{ position: "relative", maxWidth: 340, width: "100%", aspectRatio: "9 / 16", borderRadius: 20, overflow: "hidden", backgroundColor: "#000", border: `1px solid ${BORDER}` }}
          >
            {item.media_type === "video" ? (
              <video src={item.url ?? undefined} controls autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <img src={item.url ? cdnImage(item.url, 640) : undefined} alt={item.caption ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}
            {item.caption && (
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px 14px 14px", background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)" }}>
                <p style={{ color: "#fff", fontSize: 12.5, margin: 0 }}>{item.caption}</p>
              </div>
            )}
            <button
              onClick={onClose}
              style={{ position: "absolute", top: 10, insetInlineEnd: 10, width: 30, height: 30, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.6)", border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <X size={16} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
