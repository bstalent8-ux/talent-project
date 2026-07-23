"use client";
import { useSite } from "@/contexts/SiteContext";
import LandingPage from "./landing/LandingPage";
import type { TalentCard } from "../../explore/page";

interface Props {
  topTalents: TalentCard[];
  totalTalents: number;
}

export default function HomeClient({ topTalents, totalTalents }: Props) {
  const { lang } = useSite();

  return <LandingPage lang={lang} talents={topTalents} totalTalents={totalTalents} />;
}
