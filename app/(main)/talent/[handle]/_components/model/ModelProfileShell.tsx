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
// PackagesSection/ReviewsCard/ExperienceSection/BrandsCard's "model"
// variants, and MeasurementsSection as-is — all already wired to real data
// by the adapters this file imports from directly.
//
// Dropped vs. source (no real feature/data behind them — see integration
// report): Navbar (project renders one globally), Match Score gauge, AI
// Insights, Recent Activity feed, Career Timeline, the 6-metric Performance
// panel (repeat-clients/cancellation/on-time/no-show/late-arrival rates —
// none tracked), "Verified Through Talents" escrow-contract grid, the full
// interactive Calendar modal (no per-day booking target exists — Availability
// already shows the real weekly summary in the sidebar).

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
} from "@/components/profile/dynamic/adapters/talent.context";
import type { PublicProfileDTO } from "@/features/profiles/types/dto";
import type { PackageItem } from "@/features/talent-profile/types";

import PackagesSection from "../PackagesSection";
import ReviewsCard from "../ReviewsCard";
import ExperienceSection from "../ExperienceSection";

import ModelHero from "./ModelHero";
import ModelActionBar from "./ModelActionBar";
import ModelKeyStats from "./ModelKeyStats";
import ModelPortfolioBento from "./ModelPortfolioBento";
import ModelGalleryLightbox from "./ModelGalleryLightbox";
import ModelSidebar from "./ModelSidebar";
import ModelStickyBar from "./ModelStickyBar";

const RESUMABLE_ACTIONS: readonly PermissionAction[] = ["create_booking", "start_conversation", "favorite_talent"];

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

  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [showBrief, setShowBrief] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageItem | null>(null);
  const { isFavorited, error: favoriteError, toggle: toggleFavorite } = useFavoriteTalent(talent.id);

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
            <ModelKeyStats talent={talent} bookingStats={bookingStats} />
            <ModelPortfolioBento portfolioItems={portfolioItems} onOpenGallery={setGalleryIndex} />
            <ExperienceSection experience={experience} variant="model" />
            <PackagesSection packages={packages} variant="model" onSelect={setSelectedPackage} />
            <ReviewsCard reviews={reviews} rating={talent.rating} variant="model" />
          </div>

          <ModelSidebar talent={talent} brands={brands} />
        </div>
      </div>

      <ModelStickyBar
        selectedPackage={selectedPackage}
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

      <style>{`@media (min-width:1024px){.model-shell-grid{grid-template-columns:minmax(0,1fr) minmax(280px,0.4fr) !important}}`}</style>
    </main>
  );
}
