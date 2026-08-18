"use client";

// Right sidebar. Real: ModelKeyStats (rating/cancellation/bookings/views +
// admin-managed model_metrics), ModelWeeklyAvailability (real
// availability + availability_schedule), MeasurementsSection (measurements +
// languages), BrandsCard (real talent_brands — every collaboration on
// record, not just the admin-verified subset ModelVerifiedBrands shows).
// Placeholder ("Coming Soon", no fake numbers): ModelMatchScore,
// ModelAiInsights — no matching algorithm or recommendation engine exists.
// Recent Activity was dropped entirely — no activity-log table exists.

import type { TalentData, BookingStats, BrandItem } from "@/features/talent-profile/types";
import MeasurementsSection from "../MeasurementsSection";
import BrandsCard from "../BrandsCard";
import ModelKeyStats from "./ModelKeyStats";
import ModelMatchScore from "./ModelMatchScore";
import ModelAiInsights from "./ModelAiInsights";
import ModelWeeklyAvailability from "./ModelWeeklyAvailability";

interface Props {
  talent: TalentData;
  bookingStats: BookingStats;
  brands: BrandItem[];
}

export default function ModelSidebar({ talent, bookingStats, brands }: Props) {
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
      <ModelKeyStats talent={talent} bookingStats={bookingStats} />
      <ModelMatchScore />
      <ModelAiInsights />
      <ModelWeeklyAvailability availability={talent.availability} schedule={talent.availabilitySchedule} />
      {talent.measurements && <MeasurementsSection measurements={talent.measurements} languages={talent.languages} />}
      <BrandsCard brands={brands} variant="model" />
    </div>
  );
}
