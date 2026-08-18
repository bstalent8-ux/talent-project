"use client";

// Right sidebar — port of model/components/RightSidebar.tsx's 5-card stack.
// Real: MeasurementsSection (measurements + languages). Hard-coded (no real
// data source — see CLAUDE.md's model-profile report): ModelMatchScore,
// ModelAiInsights, ModelWeeklyAvailability, ModelRecentActivity.

import type { TalentData, BookingStats } from "@/features/talent-profile/types";
import MeasurementsSection from "../MeasurementsSection";
import ModelKeyStats from "./ModelKeyStats";
import ModelMatchScore from "./ModelMatchScore";
import ModelAiInsights from "./ModelAiInsights";
import ModelWeeklyAvailability from "./ModelWeeklyAvailability";
import ModelRecentActivity from "./ModelRecentActivity";

interface Props {
  talent: TalentData;
  bookingStats: BookingStats;
}

export default function ModelSidebar({ talent, bookingStats }: Props) {
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
      <ModelKeyStats talent={talent} bookingStats={bookingStats} />
      <ModelMatchScore />
      <ModelAiInsights />
      <ModelWeeklyAvailability />
      {talent.measurements && <MeasurementsSection measurements={talent.measurements} languages={talent.languages} />}
      <ModelRecentActivity talentName={talent.name} />
    </div>
  );
}
