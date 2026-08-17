"use client";

// Real replacement for model/components/modals/GalleryModal.tsx — navigates
// the real portfolioItems array (url/media_type/caption only, no fabricated
// per-photo metadata).

import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import type { PortfolioItem } from "@/features/talent-profile/types";

interface Props {
  items: PortfolioItem[];
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function ModelGalleryLightbox({ items, index, onClose, onNavigate }: Props) {
  const { dark } = useSite();
  const BORDER = dark ? "var(--border-subtle)" : "#E2E8F0";
  const item = index !== null ? items[index] : null;

  return (
    <AnimatePresence>
      {item && index !== null && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: "rgba(5,8,14,0.9)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            style={{ position: "relative", maxWidth: 480, width: "100%", maxHeight: "85vh", borderRadius: 14, overflow: "hidden", backgroundColor: "#000", border: `1px solid ${BORDER}` }}
          >
            {item.media_type === "video" ? (
              <video src={item.url ?? undefined} controls autoPlay playsInline style={{ width: "100%", maxHeight: "85vh", display: "block" }} />
            ) : (
              <img src={item.url ?? undefined} alt={item.caption ?? ""} style={{ width: "100%", maxHeight: "85vh", objectFit: "contain", display: "block" }} />
            )}

            {item.caption && (
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px 16px 14px", background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)" }}>
                <p style={{ color: "#fff", fontSize: 13, margin: 0 }}>{item.caption}</p>
              </div>
            )}

            <button onClick={onClose} style={{ position: "absolute", top: 10, insetInlineEnd: 10, width: 32, height: 32, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.6)", border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <X size={16} />
            </button>

            {items.length > 1 && (
              <>
                <button
                  onClick={() => onNavigate((index - 1 + items.length) % items.length)}
                  style={{ position: "absolute", top: "50%", insetInlineStart: 10, transform: "translateY(-50%)", width: 34, height: 34, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.6)", border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => onNavigate((index + 1) % items.length)}
                  style={{ position: "absolute", top: "50%", insetInlineEnd: 10, transform: "translateY(-50%)", width: 34, height: 34, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.6)", border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
