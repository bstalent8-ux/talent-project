"use client";
import { useSite } from "@/contexts/SiteContext";
import LandingPage from "./landing/LandingPage";
import type { TalentCard } from "../../explore/page";
import type { PublicTestimonial, PublicBrandMoment } from "@/features/landing/services/landing-content.service";

interface Props {
  topTalents: TalentCard[];
  totalTalents: number;
  completedProjects: number;
  avgRating: number;
  categoryCounts: Record<"ugc" | "model", number>;
  testimonials: PublicTestimonial[];
  brandMoments: PublicBrandMoment[];
}

export default function HomeClient({
  topTalents,
  totalTalents,
  completedProjects,
  avgRating,
  categoryCounts,
  testimonials,
  brandMoments,
}: Props) {
  const { lang } = useSite();

  return (
    <LandingPage
      lang={lang}
      talents={topTalents}
      totalTalents={totalTalents}
      completedProjects={completedProjects}
      avgRating={avgRating}
      categoryCounts={categoryCounts}
      testimonials={testimonials}
      brandMoments={brandMoments}
    />
  );
}
