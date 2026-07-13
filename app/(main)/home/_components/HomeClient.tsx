"use client";
import { useSite } from "@/contexts/SiteContext";
import HeroSection from "./HeroSection";
import AboutSection from "./AboutSection";
import FeaturedTalents from "./FeaturedTalents";
import type { TalentCard } from "../../explore/page";

interface Props {
  topTalents: TalentCard[];
  totalTalents: number;
}

export default function HomeClient({ topTalents }: Props) {
  const { lang, dark } = useSite();

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: dark ? "#050B12" : "#f1f5f9",
      fontFamily: "'Cairo', sans-serif",
    }}>
      <HeroSection dark={dark} lang={lang} />
      <AboutSection dark={dark} lang={lang} />
      <FeaturedTalents dark={dark} lang={lang} talents={topTalents} />
    </div>
  );
}
