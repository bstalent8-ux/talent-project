"use client";

// ─── TalentProfileShell ───────────────────────────────────────────────────────
// The public talent page, rendered from a PublicProfileDTO through the
// layout-driven DynamicProfileRenderer.
//
// It owns only CHROME — the things that are not sections and must survive a
// profile with no content at all:
//
//   CampaignBanner    campaign copy from the social_links blob
//   ProfileHero       name, avatar, bio, categories, socials, physical
//   TabsNavigation    scroll targets, derived from what actually rendered
//   AvailabilityCard  weekly availability strip (Model only, sidebar footer)
//   TrustVerificationCard  real trust/verification rows (Model only, sidebar footer)
//   BriefCard         the booking CTA          (sidebar footer)
//   QuestionCard      ask-a-question           (sidebar footer)
//   StickyBookingBar  the persistent book bar
//
// Everything between the tabs and the sticky bar is decided by the stored
// layout + the provider's hasContent rules, so a profile grows as its owner
// fills it in instead of shipping a fixed skeleton of empty cards.
//
// Replaces TalentModelProfile's hardcoded two-column composition. The section
// components themselves are untouched — they are reached through the adapters.

import { useMemo } from "react";
import { useSite } from "@/contexts/SiteContext";
import DynamicProfileRenderer, { useDynamicProfile } from "@/components/profile/dynamic/DynamicProfileRenderer";
import { anchorIdFor } from "@/components/profile/dynamic/anchors";
import {
  toBookingStats,
  toCampaignStats,
  toFeaturedCampaign,
  toTalentData,
} from "@/components/profile/dynamic/adapters/talent.context";
import { applyCategoryTalentLayout } from "@/components/profile/dynamic/adapters/talent-layout";
import type { PublicProfileDTO } from "@/features/profiles/types/dto";

import CampaignBanner from "./CampaignBanner";
import ProfileHero from "./ProfileHero";
import TabsNavigation, { type TabItem } from "./TabsNavigation";
import AvailabilityCard from "./AvailabilityCard";
import TrustVerificationCard from "./TrustVerificationCard";
import BriefCard from "./BriefCard";
import QuestionCard from "./QuestionCard";
import StickyBookingBar from "./StickyBookingBar";

/**
 * Tab labels for the section keys that can carry a tab.
 *
 * `bio` is listed as "about" because that is the anchor it owns
 * (SECTION_ANCHOR_ALIASES). Keys absent from this map get no tab even when they
 * render — a sidebar card is not a destination.
 */
const TAB_LABELS: Record<string, { ar: string; en: string }> = {
  bio:          { ar: "نبذة عامة",       en: "Overview" },
  portfolio:    { ar: "الصور والفيديو",   en: "Photos & Video" },
  experience:   { ar: "الخبرات",          en: "Experience" },
  packages:     { ar: "الأسعار والباقات", en: "Packages & Prices" },
  usage_addons: { ar: "حقوق الاستخدام",   en: "Usage Rights" },
};

/** Tab order, independent of layout order so the bar reads consistently. */
const TAB_ORDER = ["bio", "portfolio", "experience", "packages", "usage_addons"];

export default function TalentProfileShell({ profile }: { profile: PublicProfileDTO }) {
  const { dark, lang } = useSite();

  const talent           = useMemo(() => toTalentData(profile), [profile]);
  const campaignStats    = useMemo(() => toCampaignStats(profile), [profile]);
  const featuredCampaign = useMemo(() => toFeaturedCampaign(profile), [profile]);
  const bookingStats     = useMemo(() => toBookingStats(profile), [profile]);

  // Category-aware layout — client-side only, never written back to
  // profile_layouts. Same DTO, same sections, same renderer; only the main
  // column's order differs between ugc/model/legacy. See talent-layout.ts.
  const renderProfile = useMemo(
    () => ({ ...profile, layout: applyCategoryTalentLayout(profile.layout, talent.category) }),
    [profile, talent.category],
  );

  // Only sections that survived the provider's hasContent filter reach the DTO,
  // so a tab is built from a section that is genuinely on the page. A tab
  // scrolling to an element that was never rendered goes nowhere and reads as a
  // broken page.
  const tabs = useMemo<TabItem[]>(() => {
    const present = new Set(profile.sections.map((section) => section.key));
    return TAB_ORDER
      .filter((key) => present.has(key) && TAB_LABELS[key])
      .map((key) => ({
        key,
        label:     TAB_LABELS[key][lang === "en" ? "en" : "ar"],
        sectionId: anchorIdFor(key),
      }));
  }, [profile.sections, lang]);

  return (
    <main
      dir={lang === "en" ? "ltr" : "rtl"}
      style={{
        fontFamily:      "'Cairo', sans-serif",
        backgroundColor: dark ? "#050B12" : "#F1F5F9",
        minHeight:       "100vh",
        paddingBottom:   110,
      }}
    >
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "24px 24px" }}>
        <CampaignBanner campaignStats={campaignStats} featuredCampaign={featuredCampaign} />
        <ProfileHero talent={talent} />

        {/* A profile with one section does not need a tab bar to navigate it. */}
        {tabs.length > 1 && <TabsNavigation tabs={tabs} talent={talent} />}

        <div style={{ marginTop: 24 }}>
          <DynamicProfileRenderer
            lang={lang === "en" ? "en" : "ar"}
            profile={renderProfile}
            mainFooter={<StickyBookingBarSlot talent={talent} />}
            sidebarFooter={
              <>
                {talent.category === "model" && (
                  <>
                    <AvailabilityCard availability={talent.availability} availabilitySchedule={talent.availabilitySchedule} />
                    <TrustVerificationCard
                      verified={talent.verified}
                      identityVerified={talent.identityVerified}
                      completedProjects={bookingStats.completed}
                      reviewCount={talent.reviewCount}
                    />
                  </>
                )}
                <BriefCard
                  talentAvatar={talent.avatarUrl ?? null}
                  talentCategory={talent.category ?? null}
                  talentName={talent.name ?? ""}
                  talentUserId={talent.id}
                />
                <QuestionCard talentId={talent.id} />
              </>
            }
          />
        </div>
      </div>
    </main>
  );
}

/**
 * StickyBookingBar is fixed to the viewport, so where it sits in the DOM does
 * not affect where it draws — but it must read the package PackagesSection
 * selected, and that state lives in the renderer's context. Mounting it through
 * `mainFooter` puts it inside that provider; keeping a second copy of the
 * selection outside would drift from the one UsageRightsSection prices against,
 * which is the exact bug lifting the state was meant to prevent.
 */
function StickyBookingBarSlot({ talent }: { talent: ReturnType<typeof toTalentData> }) {
  const { selectedPackage } = useDynamicProfile();
  return <StickyBookingBar selectedPackage={selectedPackage} talent={talent} />;
}
