"use client";
import { motion } from "framer-motion";
import { CheckCircle, Calendar, Plus } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useSite } from "@/contexts/SiteContext";
import type { ExperienceItem } from "@/features/talent-profile/types";


interface Props {
  experience?: ExperienceItem[] | null;
  /** "model" swaps the heading to "Previous Shoots" — same data, same card. */
  variant?: "default" | "model";
}

export default function ExperienceSection({ experience, variant = "default" }: Props) {
  const isMobile = useIsMobile();
  const { dark, lang } = useSite();
  const ar = lang === "ar";
  const isModel = variant === "model";
  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const GREEN = "#00D26A";
  const MUTED = dark ? "#A8B3C2" : "#64748B";
  const SURFACE = dark ? "#0A121C" : "#F8FAFC";
  const projects = experience ?? [];
  if (!projects.length) return null;

  // Model gets a single compact card (this is now one half of a
  // "Previous Shoots | Brand Collaborations" row — see talent-layout.ts —
  // not the two-panel UGC composition below). The "Verified on Talents"
  // placeholder panel is dropped here on purpose: that concept is the
  // explicitly-deferred "Verified Through Talents" feature, not something to
  // half-build as a side effect of this layout change.
  if (isModel) {
    return (
      <div
        style={{
          backgroundColor: CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: 16,
          padding: 22,
          height: "100%",
        }}
      >
        <h3 style={{ color: dark ? "#fff" : "#0F172A", fontSize: 16, fontWeight: 800, margin: "0 0 16px" }}>
          {ar ? "التصويرات السابقة" : "Previous Shoots"}
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {projects.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                backgroundColor: SURFACE,
                borderRadius: 10,
                border: `1px solid ${BORDER}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <Calendar size={14} color={MUTED} style={{ flexShrink: 0 }} />
                <span style={{
                  color: dark ? "#fff" : "#0F172A", fontSize: 13, fontWeight: 600,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {p.name}
                </span>
                {p.year && <span style={{ color: MUTED, fontSize: 12, flexShrink: 0 }}>· {p.year}</span>}
              </div>
              {p.verified && (
                <CheckCircle size={15} color="var(--color-primary)" fill="color-mix(in srgb, var(--color-primary) 15%, transparent)" style={{ flexShrink: 0 }} />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: 20,
      }}
    >
      {/* Left: Previous experience */}
      <div
        style={{
          backgroundColor: CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: 16,
          padding: 22,
        }}
      >
        <h3
          style={{
            color: dark ? "#fff" : "#0F172A",
            fontSize: 16,
            fontWeight: 800,
            marginBottom: 16,
            margin: "0 0 16px",
          }}
        >
          {ar ? "الخبرات السابقة" : "Previous Experience"}
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {projects.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                backgroundColor: SURFACE,
                borderRadius: 10,
                border: `1px solid ${BORDER}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Calendar size={14} color={MUTED} />
                <span style={{ color: dark ? "#fff" : "#0F172A", fontSize: 13, fontWeight: 600 }}>{p.name}</span>
              </div>
              {p.verified && (
                <CheckCircle size={15} color={GREEN} fill="rgba(0,210,106,0.15)" />
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right: Verified on platform */}
      <div
        style={{
          backgroundColor: CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: 16,
          padding: 22,
        }}
      >
        <h3
          style={{
            color: dark ? "#fff" : "#0F172A",
            fontSize: 16,
            fontWeight: 800,
            marginBottom: 16,
            margin: "0 0 16px",
          }}
        >
          {ar ? "موثّق على Talents" : "Verified on Talents"}
        </h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            textAlign: "center",
            padding: "24px 0",
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              backgroundColor: "rgba(0,210,106,0.08)",
              border: "1px solid rgba(0,210,106,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
            }}
          >
            <Plus size={24} color={GREEN} />
          </div>
          <p style={{ color: MUTED, fontSize: 13, marginBottom: 16 }}>
            {ar ? "لا توجد مشاريع مكتملة عبر المنصة بعد" : "No completed projects on the platform yet"}
          </p>
          <motion.button
            whileHover={{ scale: 1.02, translateY: -2 }}
            style={{
              backgroundColor: GREEN,
              color: "#000",
              border: "none",
              borderRadius: 10,
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "'Cairo',sans-serif",
            }}
          >
            {ar ? "احجز أول حملة" : "Book First Campaign"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
