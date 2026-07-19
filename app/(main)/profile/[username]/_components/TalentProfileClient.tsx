"use client";
import { useState } from "react";
import { ProfileThemeContext, TX, type Lang, type Theme } from "./ProfileThemeContext";
import { useIsMobile } from "@/hooks/useIsMobile";
import PerformanceSnapshot  from "./main/PerformanceSnapshot";
import TalentHeader         from "./main/TalentHeader";
import ProfileTabs          from "./main/ProfileTabs";
import Portfolio            from "./main/Portfolio";
import PackagesSection      from "./main/PackagesSection";
import AboutSidebar         from "./sidebar/AboutSidebar";
import AvailabilitySidebar  from "./sidebar/AvailabilitySidebar";
import SocialProof          from "./sidebar/SocialProof";
import ReviewsSidebar       from "./sidebar/ReviewsSidebar";
import BrandsSidebar        from "./sidebar/BrandsSidebar";
import AskTalent            from "./sidebar/AskTalent";

export default function TalentProfileClient({ talent, brands, reviews, topBooking, isOwn }: {
  talent: any; brands: any[]; reviews: any[]; topBooking: any; isOwn?: boolean;
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [lang, setLang] = useState<Lang>("ar");
  const [mode, setMode] = useState<"dark" | "light">("dark");
  const isMobile = useIsMobile();

  const dark = mode === "dark";
  const dir  = lang === "ar" ? "rtl" : "ltr";

  const theme: Theme = {
    lang, dark, dir,
    BG:       dark ? "#030812"               : "#f5f5f0",
    CARD:     dark ? "#0d1527"               : "#ffffff",
    BORDER:   dark ? "#1e293b"               : "#e2e8f0",
    ELV:      dark ? "#111c35"               : "#f1f5f9",
    TEXT:     dark ? "#f1f5f9"               : "#0f172a",
    SUB:      dark ? "#94a3b8"               : "#475569",
    MUTED:    dark ? "#475569"               : "#94a3b8",
    GOLD:     "#FFB800",
    GOLD_BG:  "rgba(255,184,0,0.12)",
    GOLD_GLW: "rgba(255,184,0,0.35)",
  };

  const tx = TX[lang];

  return (
    <ProfileThemeContext.Provider value={theme}>
      <div style={{
        minHeight: "100vh",
        backgroundColor: theme.BG,
        fontFamily: "'Cairo', sans-serif",
        direction: dir,
        transition: "background-color 0.3s",
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 16px" }}>

          {/* Top bar: breadcrumb + toggles */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <p style={{ color: theme.MUTED, fontSize: "13px", margin: 0 }}>
              {tx.breadcrumb(talent.category ?? "", talent.name)}
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setLang(lang === "ar" ? "en" : "ar")} style={{
                background: theme.CARD, border: `1px solid ${theme.BORDER}`,
                borderRadius: "6px", padding: "4px 10px", cursor: "pointer",
                color: theme.MUTED, fontSize: "12px", fontWeight: 600,
                fontFamily: "'Cairo', sans-serif",
              }}>
                {lang === "ar" ? "EN" : "ع"}
              </button>
              <button onClick={() => setMode(dark ? "light" : "dark")} style={{
                background: theme.CARD, border: `1px solid ${theme.BORDER}`,
                borderRadius: "6px", padding: "4px 8px", cursor: "pointer", fontSize: "13px",
              }}>
                {dark ? "☀️" : "🌙"}
              </button>
            </div>
          </div>

          <PerformanceSnapshot
            profileViews={talent.profile_views}
            avgRating={talent.avg_rating}
            totalBookings={talent.total_bookings}
            totalReviews={talent.total_reviews}
            topBooking={topBooking}
          />

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 320px", gap: "16px", alignItems: "start" }}>
            <div>
              <TalentHeader talent={talent} />
              <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
              {(activeTab === "overview" || activeTab === "portfolio") && (
                <Portfolio items={talent.portfolio} isOwn={isOwn} />
              )}
              {(activeTab === "overview" || activeTab === "packages") && (
                <PackagesSection packages={talent.packages} />
              )}
              {["shoots", "verified", "reviews"].includes(activeTab) && (
                <div style={{
                  backgroundColor: theme.CARD, border: `1px solid ${theme.BORDER}`,
                  borderRadius: "12px", padding: "40px",
                  textAlign: "center", color: theme.MUTED, fontSize: "14px",
                }}>
                  {tx.comingSoon}
                </div>
              )}
            </div>

            <div style={{ position: isMobile ? "static" : "sticky", top: "76px" }}>
              <AvailabilitySidebar availability={talent.availability} />
              <AboutSidebar talent={talent} />
              <SocialProof socialLinks={talent.social_links} />
              <ReviewsSidebar reviews={reviews} avgRating={talent.avg_rating} totalReviews={talent.total_reviews} />
              <BrandsSidebar brands={brands} />
              <AskTalent name={talent.name.split(" ")[0]} />
            </div>
          </div>
        </div>
      </div>
    </ProfileThemeContext.Provider>
  );
}
