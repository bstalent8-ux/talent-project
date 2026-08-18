"use client";

// ─── Model Profile Shell ───────────────────────────────────────────────────
// Direct structural port of model/app/page.tsx: ActionBar → Hero → KeyStats
// → Portfolio → Previous Shoots → Packages → Reviews, with a right sidebar
// (Measurements/Availability/Brands) and a sticky bottom bar — built from
// real PublicProfileDTO data instead of model/lib/model-data.ts, using this
// project's real Brief/Message/Favorite actions instead of the source's
// fake modals.
//
// Bypasses the old DynamicProfileRenderer/adapters/layout system entirely,
// the same way UgcProfileShell does — this is the source's own composition
// wired to real data, not another "variant" bolted onto the generic
// renderer. Every other category (ugc, legacy, null) is unaffected —
// TalentProfileShell is untouched, and UgcProfileShell is untouched.
//
// Reuses real, already-model-aware components rather than rebuilding them:
// PackagesSection/ReviewsCard/ExperienceSection's "model" variants, and
// MeasurementsSection — all already wired to real data by the adapters this
// file imports from directly.
//
// 2026-08 update: full visual parity pass against the `model/` reference
// folder, per explicit instruction to match its layout/detail exactly even
// where that means hard-coded placeholders. See CLAUDE.md's model-profile
// report for the real-vs-hardcoded breakdown of every section added here
// (ModelMatchScore, ModelAiInsights, ModelWeeklyAvailability,
// ModelRecentActivity, ModelBottomGrid's timeline+performance — all
// hard-coded; ModelVerifiedBrands, the Quick Bio languages row, and the
// KeyStats cancellation rate — real).
//
// Dropped vs. source: Navbar (project renders one globally), the full
// interactive Calendar modal (Weekly Availability card links out to it, but
// the modal itself isn't built).

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import { useGuestGuard } from "@/contexts/GuestGuard";
import { useFavoriteTalent } from "@/hooks/useFavoriteTalent";
import type { PermissionAction } from "@/lib/permissions";
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
  toAddons,
} from "@/components/profile/dynamic/adapters/talent.context";
import type { PublicProfileDTO } from "@/features/profiles/types/dto";
import type { PackageItem } from "@/features/talent-profile/types";

import PackagesSection from "../PackagesSection";
import ExperienceSection from "../ExperienceSection";
import UsageRightsSection from "../UsageRightsSection";

import ModelHero from "./ModelHero";
import ModelActionBar from "./ModelActionBar";
import ModelPortfolioBento from "./ModelPortfolioBento";
import ModelGalleryLightbox from "./ModelGalleryLightbox";
import ModelSidebar from "./ModelSidebar";
import ModelStickyBar from "./ModelStickyBar";
import ModelVerifiedBrands from "./ModelVerifiedBrands";
import ModelBottomGrid from "./ModelBottomGrid";
import ModelTabs, { type ModelTab } from "./ModelTabs";

const RESUMABLE_ACTIONS: readonly PermissionAction[] = ["create_booking", "start_conversation", "favorite_talent"];

// HARD-CODED fallback for UsageRightsSection — shown only when the talent
// has no real talent_profiles.social_links.usage_addons entries, so the
// section isn't empty. Swap out once addons are actually seeded/editable.
const FALLBACK_ADDONS_AR = [
  { key: "raw-material", label: "تسليم المواد الخام (Raw Footage)", price: 800 },
  { key: "extra-hour", label: "ساعة تصوير إضافية", price: 500 },
  { key: "extra-transition", label: "لوكيشن / انتقال إضافي", price: 600 },
];
const FALLBACK_ADDONS_EN = [
  { key: "raw-material", label: "Raw footage delivery", price: 800 },
  { key: "extra-hour", label: "Extra shooting hour", price: 500 },
  { key: "extra-transition", label: "Extra location / transition", price: 600 },
];

export default function ModelProfileShell({ profile }: { profile: PublicProfileDTO }) {
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const router = useRouter();
  const guard = useGuestGuard();

  const talent         = useMemo(() => toTalentData(profile), [profile]);
  const presenceLinks  = useMemo(() => toPresenceLinks(profile), [profile]);
  const portfolioItems = useMemo(() => toPortfolioItems(profile), [profile]);
  const packages       = useMemo(() => toPackages(profile), [profile]);
  const reviews        = useMemo(() => toReviews(profile, ar ? "ar-EG" : "en-US"), [profile, ar]);
  const experience     = useMemo(() => toExperience(profile), [profile]);
  const brands         = useMemo(() => toBrandItems(profile), [profile]);
  const bookingStats   = useMemo(() => toBookingStats(profile), [profile]);
  const realAddons     = useMemo(() => toAddons(profile), [profile]);
  const addons         = useMemo(
    () => (realAddons && realAddons.length > 0 ? realAddons : (ar ? FALLBACK_ADDONS_AR : FALLBACK_ADDONS_EN)),
    [realAddons, ar],
  );

  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [showBrief, setShowBrief] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageItem | null>(null);
  const [checkedAddons, setCheckedAddons] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState("portfolio");
  const { isFavorited, error: favoriteError, toggle: toggleFavorite } = useFavoriteTalent(talent.id);

  const toggleAddon = (key: string) => setCheckedAddons((prev) => ({ ...prev, [key]: !prev[key] }));
  const addonsTotal = addons.reduce((sum, a) => sum + (checkedAddons[a.key] ? a.price : 0), 0);

  const tabs = useMemo<ModelTab[]>(() => {
    const list: ModelTab[] = [];
    if (portfolioItems.length > 0) list.push({ key: "portfolio", anchor: "model-portfolio", label: ar ? "Portfolio" : "Portfolio" });
    if ((experience ?? []).length > 0 || brands.some((b) => b.verified)) list.push({ key: "shoots", anchor: "model-shoots", label: ar ? "أعمال سابقة" : "Previous Work" });
    if ((packages ?? []).length > 0) list.push({ key: "packages", anchor: "model-packages", label: ar ? "باقات وأسعار" : "Packages & Prices" });
    list.push({ key: "performance", anchor: "model-performance", label: ar ? "أداء وتقييم" : "Performance & Reviews" });
    return list;
  }, [portfolioItems.length, experience, brands, packages, ar]);

  function openMessage() {
    window.dispatchEvent(new CustomEvent("open-chat-widget", {
      detail: {
        otherUserId: talent.id,
        otherUser: { id: talent.id, full_name: talent.name, avatar_url: talent.avatarUrl, handle: talent.handle },
      },
    }));
  }

  // Same resume-after-auth mechanism as UgcProfileShell — see that file's
  // comment for the full rationale (GuestGuard.tsx's `go()` sets
  // `?next=<page>&resume=<action>` on the login/register redirect).
  useEffect(() => {
    if (guard.loading) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const resume = params.get("resume");
    if (!resume || !RESUMABLE_ACTIONS.includes(resume as PermissionAction)) return;

    const action = resume as PermissionAction;
    if (guard.can(action)) {
      if (action === "create_booking") setShowBrief(true);
      else if (action === "start_conversation") setTimeout(openMessage, 0);
      else if (action === "favorite_talent") toggleFavorite();
    } else {
      guard.requestAuth(action);
    }

    params.delete("resume");
    params.delete("next");
    const qs = params.toString();
    router.replace(`${window.location.pathname}${qs ? `?${qs}` : ""}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guard.loading]);

  return (
    <main
      dir={ar ? "rtl" : "ltr"}
      style={{ fontFamily: "'Cairo', sans-serif", backgroundColor: dark ? "var(--bg-page)" : "#F1F5F9", minHeight: "100vh", paddingBottom: 90 }}
    >
      <ModelActionBar
        talentId={talent.id}
        talentName={talent.name}
        talentAvatar={talent.avatarUrl ?? null}
        talentHandle={talent.handle}
        isFavorited={isFavorited}
        onToggleFavorite={toggleFavorite}
        favoriteError={favoriteError}
      />

      <div style={{ width: "min(var(--container-max, 1440px), 100%)", margin: "0 auto", padding: "20px var(--container-pad, 24px)" }}>
        <div className="model-shell-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
            <ModelHero
              talent={talent}
              presenceLinks={presenceLinks}
              firstPortfolioItem={portfolioItems[0] ?? null}
              onOpenGallery={() => setGalleryIndex(0)}
            />
            <ModelTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

            <div id="model-portfolio">
              <ModelPortfolioBento portfolioItems={portfolioItems} onOpenGallery={setGalleryIndex} />
            </div>

            <div id="model-shoots" className="model-shoots-row" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
              <ExperienceSection experience={experience} variant="model" />
              <ModelVerifiedBrands brands={brands} />
            </div>

            <div id="model-packages">
              <PackagesSection packages={packages} variant="model" onSelect={setSelectedPackage} />
            </div>

            <UsageRightsSection
              selectedPackage={selectedPackage}
              addons={addons}
              checked={checkedAddons}
              onToggle={toggleAddon}
              showBookButton={false}
            />

            <div id="model-performance">
              <ModelBottomGrid reviews={reviews} reviewCount={talent.reviewCount} />
            </div>
          </div>

          <ModelSidebar talent={talent} bookingStats={bookingStats} />
        </div>
      </div>

      <ModelStickyBar
        selectedPackage={selectedPackage}
        addonsTotal={addonsTotal}
        identityVerified={Boolean(talent.identityVerified)}
        onContinueToBrief={() => setShowBrief(true)}
      />

      <ModelGalleryLightbox
        items={portfolioItems}
        index={galleryIndex}
        onClose={() => setGalleryIndex(null)}
        onNavigate={setGalleryIndex}
      />

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

      <style>{`@media (min-width:1024px){.model-shell-grid{grid-template-columns:minmax(0,1fr) minmax(280px,0.4fr) !important}}@media (min-width:640px){.model-shoots-row{grid-template-columns:1fr 1fr !important}}`}</style>
    </main>
  );
}
