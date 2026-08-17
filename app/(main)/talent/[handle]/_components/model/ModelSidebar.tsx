"use client";

// Port of model/components/RightSidebar.tsx. Only 3 of its 5 cards survive:
// Measurements (real — reuses the existing MeasurementsSection component
// as-is, the exact 5 approved Model fields), Availability (real —
// formatAvailabilitySummary + availabilitySchedule, already used elsewhere
// on Model profiles), Brands (real — reuses the existing BrandsCard
// component's "model" variant, already built for real logo_url/
// year_collaborated data).
//
// Dropped — no real data anywhere (see integration report):
//   - Match Score gauge + factors (no AI-matching feature exists)
//   - AI Insights (same — no recommendation engine)
//   - Recent Activity feed (no activity-log table exposed to talent pages)

import { useSite } from "@/contexts/SiteContext";
import { formatAvailabilitySummary } from "@/lib/availability-schedule";
import type { TalentData, BrandItem } from "@/features/talent-profile/types";
import MeasurementsSection from "../MeasurementsSection";
import BrandsCard from "../BrandsCard";
import { CalendarCheck } from "lucide-react";

interface Props {
  talent: TalentData;
  brands: BrandItem[];
}

export default function ModelSidebar({ talent, brands }: Props) {
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = dark ? "var(--bg-surface)" : "#FFFFFF";
  const BORDER = dark ? "var(--border-subtle)" : "#E2E8F0";
  const TEXT = dark ? "var(--text-primary)" : "#0F172A";
  const MUTED = dark ? "var(--text-muted)" : "#64748B";
  const GOLD = "#d89b37";

  const availabilitySummary = formatAvailabilitySummary(talent.availability, talent.availabilitySchedule, lang);

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
      {availabilitySummary && (
        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 18 }}>
          <h3 style={{ color: TEXT, fontSize: 14, fontWeight: 800, margin: "0 0 10px", display: "flex", alignItems: "center", gap: 8 }}>
            <CalendarCheck size={15} color={GOLD} />{ar ? "التوفر" : "Availability"}
          </h3>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 700,
            backgroundColor: talent.availability === "available" ? "rgba(16,185,129,0.12)" : "rgba(244,63,94,0.1)",
            color: talent.availability === "available" ? "#34d399" : "#fb7185",
            border: `1px solid ${talent.availability === "available" ? "#10b98155" : "#f43f5e55"}`,
          }}>
            {availabilitySummary}
          </span>
        </div>
      )}

      {talent.measurements && <MeasurementsSection measurements={talent.measurements} />}

      <BrandsCard brands={brands} variant="model" />
    </div>
  );
}
