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
}

export default function PortfolioSection({ portfolioItems }: Props) {
  const isMobile = useIsMobile();
  const { dark } = useSite();
  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const GREEN = "#00D26A";
  const MUTED = dark ? "#A8B3C2" : "#64748B";
  const hasReal = portfolioItems && portfolioItems.length > 0;

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
        <h2 style={{ color: dark ? "#fff" : "#0F172A", fontSize: 18, fontWeight: 800, margin: 0 }}>البورتفوليو</h2>
        <button
          style={{
            background: "none",
            border: "none",
            color: GREEN,
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "'Cairo',sans-serif",
          }}
        >
          عرض الكل ›
        </button>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(6,1fr)",
          gap: 12,
        }}
      >
        {hasReal ? (
          portfolioItems.slice(0, 6).map((item, i) => (
            <motion.div
              key={item.id ?? i}
              whileHover={{ scale: 1.04 }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              style={{
                position: "relative",
                height: 180,
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
                  backgroundColor: "rgba(0,210,106,0.15)",
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
                    backgroundColor: GREEN,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {item.media_type === "video" ? (
                    <Play size={16} color="#000" fill="#000" />
                  ) : (
                    <Image size={16} color="#000" />
                  )}
                </div>
              </motion.div>
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
            </motion.div>
          ))
        ) : (
          <div
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "48px 0",
              color: MUTED,
              fontSize: 14,
            }}
          >
            لا توجد أعمال في البورتفوليو بعد
          </div>
        )}
      </div>
    </div>
  );
}
