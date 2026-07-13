"use client";
import { useSite } from "@/contexts/SiteContext";
import CommunityHero from "./CommunityHero";
import CommunityFeed from "./CommunityFeed";

export default function CommunityClient() {
  const { dark, lang } = useSite();
  const ar = lang === "ar";

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: dark ? "#050B12" : "#f1f5f9",
      fontFamily: "'Cairo', sans-serif",
      direction: ar ? "rtl" : "ltr",
      transition: "background-color 0.3s ease",
    }}>
      <CommunityHero dark={dark} lang={lang} />
      <CommunityFeed dark={dark} lang={lang} />
    </div>
  );
}
