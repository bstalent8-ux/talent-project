"use client";

// Port of ugc/untitled/components/PreviousShoots.tsx's "Previous Shoots"
// card, backed by the real ExperienceItem[] (name/year/verified). The
// source's second block ("Verified Through Talents" — escrow-completed
// contracts with fabricated ROAS/view-count results) has no real backing:
// there is no escrow, and completed bookings don't carry campaign copy or
// results metrics — so that block is not reproduced. See integration report.

import { motion } from "framer-motion";
import { Briefcase, CheckCircle2 } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import type { ExperienceItem } from "@/features/talent-profile/types";

export default function UgcPreviousShoots({ experience }: { experience: ExperienceItem[] | null }) {
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const TEXT = dark ? "#fff" : "#0F172A";
  const MUTED = dark ? "#A8B3C2" : "#64748B";
  const SURFACE = dark ? "#0A121C" : "#F8FAFC";
  const VIOLET = "#7C3AED";

  const items = experience ?? [];
  if (items.length === 0) return null;

  return (
    <section id="ugc-shoots" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: dark ? "rgba(148,163,184,0.12)" : "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Briefcase size={15} color={MUTED} />
        </div>
        <h2 style={{ color: TEXT, fontSize: 18, fontWeight: 800, margin: 0 }}>{ar ? "أعمال سابقة" : "Previous Shoots"}</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
        {items.map((p, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: TEXT, fontSize: 13, fontWeight: 800 }}>{p.name}</span>
              {p.verified && <CheckCircle2 size={15} color={VIOLET} />}
            </div>
            {p.year && <span style={{ color: MUTED, fontSize: 11 }}>{p.year}</span>}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
