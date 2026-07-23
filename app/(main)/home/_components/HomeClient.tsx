"use client";
import { useSite } from "@/contexts/SiteContext";
import LandingPage from "./landing/LandingPage";
import type { TalentCard } from "../../explore/page";
import type { MarketplacePackage, TalentType } from "@/features/packages/types";
import type { MarketplaceCategory } from "@/features/categories/types";

interface Props {
  topTalents: TalentCard[];
  totalTalents: number;
  talentTypes: TalentType[];
  categories: MarketplaceCategory[];
  pricingPackages: MarketplacePackage[];
  initialPricingTalentType: string;
}

export default function HomeClient({
  topTalents,
  totalTalents,
  talentTypes,
  categories,
  pricingPackages,
  initialPricingTalentType,
}: Props) {
  const { lang } = useSite();

  return (
    <LandingPage
      lang={lang}
      talents={topTalents}
      totalTalents={totalTalents}
      talentTypes={talentTypes}
      categories={categories}
      pricingPackages={pricingPackages}
      initialPricingTalentType={initialPricingTalentType}
    />
  );
}
