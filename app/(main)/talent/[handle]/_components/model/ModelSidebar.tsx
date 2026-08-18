"use client";

// Right sidebar. Real: ModelWeeklyAvailability (real availability +
// availability_schedule), MeasurementsSection (measurements + languages),
// BrandsCard (real talent_brands — every collaboration on record, not just
// the admin-verified subset ModelVerifiedBrands shows). Placeholder
// ("Coming Soon", no fake numbers): ModelMatchScore, ModelAiInsights — no
// matching algorithm or recommendation engine exists.
// ModelKeyStats moved to the main column (full-width strip under the hero
// photo) on request — see ModelProfileShell.tsx.

import type { TalentData, BrandItem } from "@/features/talent-profile/types";
import MeasurementsSection from "../MeasurementsSection";
import BrandsCard from "../BrandsCard";
import ModelMatchScore from "./ModelMatchScore";
import ModelAiInsights from "./ModelAiInsights";
import ModelWeeklyAvailability from "./ModelWeeklyAvailability";

interface Props {
  talent: TalentData;
  brands: BrandItem[];
}

export default function ModelSidebar({ talent, brands }: Props) {
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
      <ModelMatchScore />
      <ModelAiInsights />
      <ModelWeeklyAvailability availability={talent.availability} schedule={talent.availabilitySchedule} />
      {talent.measurements && <MeasurementsSection measurements={talent.measurements} languages={talent.languages} />}
      <BrandsCard brands={brands} variant="model" />
    </div>
  );
}
