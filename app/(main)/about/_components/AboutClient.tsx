"use client";
import { useSite } from "@/contexts/SiteContext";
import AboutHero    from "./AboutHero";
import MissionVision from "./MissionVision";
import HowItWorks   from "./HowItWorks";
import StatsSection  from "./StatsSection";
import AboutCTA      from "./AboutCTA";

export default function AboutClient() {
  const { dark, lang } = useSite();

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: dark ? "#050B12" : "#f1f5f9",
      fontFamily: "'Cairo', sans-serif",
    }}>
      <AboutHero    dark={dark} lang={lang} />
      <MissionVision dark={dark} lang={lang} />
      <HowItWorks   dark={dark} lang={lang} />
      <StatsSection  dark={dark} lang={lang} />
      <AboutCTA      dark={dark} lang={lang} />
    </div>
  );
}
