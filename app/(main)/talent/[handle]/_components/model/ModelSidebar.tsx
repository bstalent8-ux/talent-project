"use client";

// Right sidebar, in the reference's order: AI Insights, this week's availability,
// Quick Bio, the model's recent activity. Real: availability (talent_profiles
// availability + availability_schedule), Quick Bio (languages + measurements),
// Recent Activity (dated portfolio uploads). AI Insights is fixed sample copy —
// see ModelAiInsights.tsx.

import type { TalentData, BrandItem, PortfolioItem } from "@/features/talent-profile/types";
import ModelAiInsights from "./ModelAiInsights";
import ModelWeeklyAvailability from "./ModelWeeklyAvailability";
import ModelQuickBio from "./ModelQuickBio";
import ModelRecentActivity from "./ModelRecentActivity";

interface Props {
  talent: TalentData;
  brands?: BrandItem[];
  portfolioItems: PortfolioItem[];
}

export default function ModelSidebar({ talent, portfolioItems }: Props) {
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
      <ModelAiInsights />
      <ModelWeeklyAvailability availability={talent.availability} schedule={talent.availabilitySchedule} />
      <ModelQuickBio measurements={talent.measurements} languages={talent.languages} />
      <ModelRecentActivity portfolioItems={portfolioItems} name={talent.name} />
    </div>
  );
}
