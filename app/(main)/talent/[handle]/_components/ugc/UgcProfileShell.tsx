"use client";

// ─── UGC Profile Shell ─────────────────────────────────────────────────────
// Direct structural port of ugc/untitled/app/page.tsx: Hero → QuickTabs →
// two-column (8/4) main body → sidebar, built from real PublicProfileDTO
// data instead of ugc/untitled/data/creatorData.ts, using this project's
// real Brief/Message actions instead of the source's fake modals.
//
// Bypasses the old DynamicProfileRenderer/adapters/layout system entirely —
// this is not another "variant" bolted onto the old talent components, it
// is the source's own composition, rebuilt with real data. Model and every
// other non-"ugc" category still render through TalentProfileShell,
// unchanged.
//
// Dropped vs. source (no real feature/data behind them — see integration
// report): Navbar (project already renders one globally), currency
// switcher (EGP-only), Top Content Types donut chart, AI Match Score,
// Insights & Recent Activity, "Verified Through Talents" escrow-contract
// grid, campaign banner chrome (not part of the source composition).

import { useMemo, useState } from "react";
import { useSite } from "@/contexts/SiteContext";
import DirectBriefModal from "@/components/DirectBriefModal";
import {
  toTalentData,
  toPresenceLinks,
  toPortfolioItems,
  toPackages,
  toReviews,
  toExperience,
  toBrandItems,
  toBookingStats,
} from "@/components/profile/dynamic/adapters/talent.context";
import type { PublicProfileDTO } from "@/features/profiles/types/dto";
import type { PortfolioItem } from "@/features/talent-profile/types";

import UgcHero from "./UgcHero";
import UgcTabs, { type UgcTab } from "./UgcTabs";
import UgcVideoPortfolio from "./UgcVideoPortfolio";
import UgcVideoLightbox from "./UgcVideoLightbox";
import UgcPerformanceMetrics from "./UgcPerformanceMetrics";
import UgcContentSpecialties from "./UgcContentSpecialties";
import UgcPreviousShoots from "./UgcPreviousShoots";
import UgcPackages from "./UgcPackages";
import UgcBrands from "./UgcBrands";
import UgcReviews from "./UgcReviews";
import UgcSafetyTrust from "./UgcSafetyTrust";

export default function UgcProfileShell({ profile }: { profile: PublicProfileDTO }) {
  const { dark, lang } = useSite();
  const ar = lang !== "en";

  const talent          = useMemo(() => toTalentData(profile), [profile]);
  const presenceLinks   = useMemo(() => toPresenceLinks(profile), [profile]);
  const portfolioItems  = useMemo(() => toPortfolioItems(profile), [profile]);
  const packages        = useMemo(() => toPackages(profile), [profile]);
  const reviews         = useMemo(() => toReviews(profile, ar ? "ar-EG" : "en-US"), [profile, ar]);
  const experience      = useMemo(() => toExperience(profile), [profile]);
  const brands          = useMemo(() => toBrandItems(profile), [profile]);
  const bookingStats    = useMemo(() => toBookingStats(profile), [profile]);

  const [activeTab, setActiveTab] = useState("portfolio");
  const [lightboxItem, setLightboxItem] = useState<PortfolioItem | null>(null);
  const [showBrief, setShowBrief] = useState(false);

  const hasPerformance = talent.rating > 0 || talent.reviewCount > 0 || bookingStats.total > 0;

  const tabs = useMemo<UgcTab[]>(() => {
    const list: UgcTab[] = [];
    if (portfolioItems.length > 0) list.push({ key: "portfolio", anchor: "ugc-portfolio", label: ar ? "معرض الفيديوهات" : "Video Portfolio" });
    if (hasPerformance) list.push({ key: "performance", anchor: "ugc-performance", label: ar ? "مؤشرات الأداء" : "Performance" });
    if ((experience ?? []).length > 0) list.push({ key: "shoots", anchor: "ugc-shoots", label: ar ? "أعمال سابقة" : "Previous Shoots" });
    if ((packages ?? []).length > 0) list.push({ key: "packages", anchor: "ugc-packages", label: ar ? "الباقات والأسعار" : "Packages & Prices" });
    if (reviews.length > 0) list.push({ key: "reviews", anchor: "ugc-reviews", label: ar ? "التقييمات" : "Reviews" });
    return list;
  }, [portfolioItems.length, hasPerformance, experience, packages, reviews.length, ar]);

  return (
    <main
      dir={ar ? "rtl" : "ltr"}
      style={{
        fontFamily: "'Cairo', sans-serif",
        backgroundColor: dark ? "#050B12" : "#F1F5F9",
        minHeight: "100vh",
        paddingBottom: 60,
      }}
    >
      {/* Full-bleed band — deliberately OUTSIDE the centered container below,
          so its dark background spans the whole page width. Its own inner
          content still centers at --container-max (see UgcHero.tsx). */}
      <UgcHero
        talent={talent}
        presenceLinks={presenceLinks}
        portfolioItems={portfolioItems}
        bookingStats={bookingStats}
        onOpenBrief={() => setShowBrief(true)}
        onOpenVideo={setLightboxItem}
      />

      <div style={{ width: "min(var(--container-max), 100%)", margin: "0 auto", padding: "24px var(--container-pad)" }}>
        <UgcTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(280px, 0.4fr)", gap: 20, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
            <UgcVideoPortfolio portfolioItems={portfolioItems} onSelectVideo={setLightboxItem} />
            {hasPerformance && <UgcPerformanceMetrics talent={talent} bookingStats={bookingStats} />}
            <UgcPreviousShoots experience={experience} />
            <UgcPackages packages={packages} onSelectPackage={() => setShowBrief(true)} />
            <UgcReviews reviews={reviews} rating={talent.rating} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <UgcContentSpecialties specialties={talent.specialties ?? []} />
            <UgcBrands brands={brands} />
            <UgcSafetyTrust talentUserId={talent.id} onOpenBrief={() => setShowBrief(true)} />
          </div>
        </div>
      </div>

      <UgcVideoLightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />

      {showBrief && (
        <DirectBriefModal
          talentUserId={talent.id}
          talentName={talent.name ?? ""}
          talentAvatar={talent.avatarUrl ?? null}
          talentCategory={talent.category ?? null}
          dark={dark}
          lang={lang}
          onClose={() => setShowBrief(false)}
          onSuccess={() => setShowBrief(false)}
        />
      )}
    </main>
  );
}
