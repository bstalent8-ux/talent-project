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
// switcher (EGP-only), campaign banner chrome (not part of the source
// composition). Top Content Types donut, AI Match Score, Insights & Recent
// Activity, and "Verified Through Talents" are now included — HARDCODED
// per explicit user request to match the reference visually (see
// UgcContentChart.tsx / UgcInsightsActivity.tsx / UgcHero.tsx /
// UgcPreviousShoots.tsx for what's real vs. fixed).

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import { useGuestGuard } from "@/contexts/GuestGuard";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useFavoriteTalent } from "@/hooks/useFavoriteTalent";
import type { PermissionAction } from "@/lib/permissions";
import DirectBriefModal from "@/components/DirectBriefModal";
import PackageBookingModal from "@/components/PackageBookingModal";
import ProfileViewTracker from "@/components/analytics/ProfileViewTracker";
import {
  toTalentData,
  toPresenceLinks,
  toPortfolioItems,
  toPackages,
  toReviews,
  toExperience,
  toBrandItems,
  toBookingStats,
  toAddons,
} from "@/components/profile/dynamic/adapters/talent.context";
import type { PublicProfileDTO } from "@/features/profiles/types/dto";
import type { PackageItem, PortfolioItem } from "@/features/talent-profile/types";

import UgcHero from "./UgcHero";
import UgcTabs, { type UgcTab } from "./UgcTabs";
import UgcVideoPortfolio from "./UgcVideoPortfolio";
import UgcVideoLightbox from "./UgcVideoLightbox";
import UgcPerformanceMetrics from "./UgcPerformanceMetrics";
import UgcContentSpecialties from "./UgcContentSpecialties";
import UgcPerformanceOverview from "./UgcPerformanceOverview";
import UgcPreviousShoots from "./UgcPreviousShoots";
import UgcPackages from "./UgcPackages";
import UgcBrands from "./UgcBrands";
import UgcReviews from "./UgcReviews";
import UgcInsightsActivity from "./UgcInsightsActivity";
import UgcSafetyTrust from "./UgcSafetyTrust";
import UsageRightsSection from "../UsageRightsSection";
import ModelStickyBar from "../model/ModelStickyBar";
import { FALLBACK_ADDONS_AR, FALLBACK_ADDONS_EN } from "@/lib/booking/addons";

/** The three actions this shell can resume after an auth round-trip —
 * anything else in `?resume=` is ignored rather than trusted blindly. */
const RESUMABLE_ACTIONS: readonly PermissionAction[] = ["create_booking", "start_conversation", "favorite_talent"];

export default function UgcProfileShell({ profile }: { profile: PublicProfileDTO }) {
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const router = useRouter();
  const guard = useGuestGuard();
  const compact = useIsMobile(1024);

  const talent          = useMemo(() => toTalentData(profile), [profile]);
  const presenceLinks   = useMemo(() => toPresenceLinks(profile), [profile]);
  const portfolioItems  = useMemo(() => toPortfolioItems(profile), [profile]);
  const packages        = useMemo(() => toPackages(profile), [profile]);
  const reviews         = useMemo(() => toReviews(profile, ar ? "ar-EG" : "en-US"), [profile, ar]);
  const experience      = useMemo(() => toExperience(profile), [profile]);
  const brands          = useMemo(() => toBrandItems(profile), [profile]);
  const bookingStats    = useMemo(() => toBookingStats(profile), [profile]);
  const realAddons      = useMemo(() => toAddons(profile), [profile]);
  const addons          = useMemo(
    () => (realAddons && realAddons.length > 0 ? realAddons : (ar ? FALLBACK_ADDONS_AR : FALLBACK_ADDONS_EN)),
    [realAddons, ar],
  );

  const [activeTab, setActiveTab] = useState("portfolio");
  const [lightboxItem, setLightboxItem] = useState<PortfolioItem | null>(null);
  const [showBrief, setShowBrief] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageItem | null>(null);
  const [checkedAddons, setCheckedAddons] = useState<Record<string, boolean>>({});
  const { isFavorited, error: favoriteError, toggle: toggleFavorite } = useFavoriteTalent(talent.id);

  const toggleAddon = (key: string) => setCheckedAddons((prev) => ({ ...prev, [key]: !prev[key] }));
  const addonsTotal = addons.reduce((sum, a) => sum + (checkedAddons[a.key] ? a.price : 0), 0);

  const hasPerformance = talent.rating > 0 || talent.reviewCount > 0 || bookingStats.total > 0;

  function openMessage() {
    window.dispatchEvent(new CustomEvent("open-chat-widget", {
      detail: {
        otherUserId: talent.id,
        otherUser: { id: talent.id, full_name: talent.name, avatar_url: talent.avatarUrl, handle: talent.handle },
      },
    }));
  }

  // Resume-after-auth: GuestGuard's modal sends the user to /login or
  // /register with `?next=<this page>&resume=<action>` baked into `next`
  // (see GuestGuard.tsx's go()). Once auth has resolved, re-fire the exact
  // action they originally clicked instead of leaving them back on a page
  // where they have to find the button again. If they're STILL not allowed
  // (e.g. registered as Talent from the Hire gate), surface the same
  // role-specific message GuestGuard already shows on a blocked click,
  // rather than silently doing nothing.
  useEffect(() => {
    if (guard.loading) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const resume = params.get("resume");
    if (!resume || !RESUMABLE_ACTIONS.includes(resume as PermissionAction)) return;

    const action = resume as PermissionAction;
    if (guard.can(action)) {
      if (action === "create_booking") setShowBrief(true);
      else if (action === "start_conversation") {
        // GlobalChat/FloatingChatWidget mounts AFTER this page in the layout
        // tree (Navbar → main → Footer → GlobalChat), so on the very render
        // where auth just resolved post-login, its "open-chat-widget"
        // listener hasn't attached yet — dispatching synchronously here
        // fires into an empty room. Deferring a tick lets that mount finish
        // first.
        setTimeout(openMessage, 0);
      }
      else if (action === "favorite_talent") toggleFavorite();
    } else {
      guard.requestAuth(action);
    }

    params.delete("resume");
    params.delete("next");
    const qs = params.toString();
    router.replace(`${window.location.pathname}${qs ? `?${qs}` : ""}`);
    // Fires once per mount when auth finishes resolving — re-running on
    // every guard/talent identity change would re-trigger the action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guard.loading]);

  const tabs = useMemo<UgcTab[]>(() => {
    const list: UgcTab[] = [];
    if (portfolioItems.length > 0) list.push({ key: "portfolio", anchor: "ugc-portfolio", label: ar ? "معرض الفيديوهات" : "Video Portfolio" });
    list.push({ key: "performance", anchor: "ugc-performance", label: ar ? "مؤشرات الأداء" : "Performance" });
    list.push({ key: "shoots", anchor: "ugc-shoots", label: ar ? "أعمال سابقة" : "Previous Shoots" });
    list.push({ key: "packages", anchor: "ugc-packages", label: ar ? "الباقات والأسعار" : "Packages & Prices" });
    list.push({ key: "reviews", anchor: "ugc-reviews", label: ar ? "التقييمات" : "Reviews" });
    return list;
  }, [portfolioItems.length, ar]);

  return (
    <main
      dir={ar ? "rtl" : "ltr"}
      style={{
        fontFamily: "'IBM Plex Sans Arabic', sans-serif",
        backgroundColor: dark ? "#050B12" : "#F1F5F9",
        minHeight: "100vh",
        paddingBottom: 90,
      }}
    >
      <ProfileViewTracker profileUserId={talent.id} />
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
        isFavorited={isFavorited}
        onToggleFavorite={toggleFavorite}
        favoriteError={favoriteError}
      />

      <div style={{ width: "min(var(--container-max), 100%)", margin: "0 auto", padding: "24px var(--container-pad)" }}>
        <UgcTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

        {/* Portfolio + specialties sit side by side straight under the hero. */}
        <div style={{ display: "grid", gridTemplateColumns: compact ? "minmax(0,1fr)" : "minmax(0,7fr) minmax(0,3fr)", gap: 20, alignItems: "start", marginBottom: 20 }}>
          <UgcVideoPortfolio portfolioItems={portfolioItems} onSelectVideo={setLightboxItem} />
          <UgcContentSpecialties specialties={talent.specialties ?? []} />
        </div>

        {/* Performance metrics + content-type mix (fixed demo figures — see the component). */}
        <div style={{ marginBottom: 20 }}>
          <UgcPerformanceOverview />
        </div>

        <div style={{ marginBottom: 20 }}>
          <UgcPreviousShoots experience={experience} brands={brands} />
        </div>

        {/* Packages + brands worked with, side by side. */}
        <div style={{ display: "grid", gridTemplateColumns: compact ? "minmax(0,1fr)" : "minmax(0,1.75fr) minmax(0,1fr)", gap: 20, alignItems: "start", marginBottom: 20 }}>
          <UgcPackages packages={packages} selectedId={selectedPackage?.id} onSelectPackage={setSelectedPackage} />
          <UgcBrands brands={brands} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(280px, 0.4fr)", gap: 20, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
            {hasPerformance && <UgcPerformanceMetrics talent={talent} bookingStats={bookingStats} />}
            <UsageRightsSection
              selectedPackage={selectedPackage}
              addons={addons}
              checked={checkedAddons}
              onToggle={toggleAddon}
              showBookButton={false}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <UgcSafetyTrust
              talentUserId={talent.id}
              talentName={talent.name}
              talentAvatar={talent.avatarUrl ?? null}
              onOpenBrief={() => setShowBrief(true)}
            />
          </div>
        </div>

        {/* Last row: reviews, insights and recent activity (insights/activity are fixed demo text). */}
        <div style={{ display: "grid", gridTemplateColumns: compact ? "minmax(0,1fr)" : "minmax(0,1.35fr) minmax(0,1fr) minmax(0,1fr)", gap: 20, alignItems: "start", marginTop: 20 }}>
          <UgcReviews reviews={reviews} brands={brands} />
          <UgcInsightsActivity />
        </div>
      </div>

      <UgcVideoLightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />

      <ModelStickyBar
        selectedPackage={selectedPackage}
        addonsTotal={addonsTotal}
        identityVerified={Boolean(talent.identityVerified)}
        onContinueToBrief={() => setShowBrief(true)}
      />

      {showBrief && selectedPackage && (
        <PackageBookingModal
          talentUserId={talent.id}
          talentName={talent.name ?? ""}
          talentAvatar={talent.avatarUrl ?? null}
          talentCategory={talent.category ?? null}
          dark={dark}
          lang={lang}
          selectedPackage={selectedPackage}
          addons={addons}
          checkedAddons={checkedAddons}
          availabilitySchedule={talent.availabilitySchedule}
          onClose={() => setShowBrief(false)}
          onSuccess={() => setShowBrief(false)}
        />
      )}

      {showBrief && !selectedPackage && (
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
