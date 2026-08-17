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

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import { useGuestGuard } from "@/contexts/GuestGuard";
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

/** The three actions this shell can resume after an auth round-trip —
 * anything else in `?resume=` is ignored rather than trusted blindly. */
const RESUMABLE_ACTIONS: readonly PermissionAction[] = ["create_booking", "start_conversation", "favorite_talent"];

export default function UgcProfileShell({ profile }: { profile: PublicProfileDTO }) {
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const router = useRouter();
  const guard = useGuestGuard();

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
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoritePending, setFavoritePending] = useState(false);

  const hasPerformance = talent.rating > 0 || talent.reviewCount > 0 || bookingStats.total > 0;

  function openMessage() {
    window.dispatchEvent(new CustomEvent("open-chat-widget", {
      detail: {
        otherUserId: talent.id,
        otherUser: { id: talent.id, full_name: talent.name, avatar_url: talent.avatarUrl, handle: talent.handle },
      },
    }));
  }

  async function toggleFavorite() {
    if (guard.isGuest || favoritePending) return;
    setFavoritePending(true);
    const next = !isFavorited;
    setIsFavorited(next); // optimistic — reverted below on failure
    try {
      const res = await fetch(`/api/favorites/${talent.id}`, { method: next ? "PUT" : "DELETE" });
      if (!res.ok) setIsFavorited(!next);
    } catch {
      setIsFavorited(!next);
    } finally {
      setFavoritePending(false);
    }
  }

  // Hydrate the heart's saved state once we know who's looking — real
  // per-user persistence via GET /api/favorites/[talentUserId], not
  // localStorage (task requirement: no local-only favorites).
  useEffect(() => {
    if (guard.loading || guard.isGuest) { setIsFavorited(false); return; }
    let cancelled = false;
    fetch(`/api/favorites/${talent.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (!cancelled && data) setIsFavorited(Boolean(data.favorited)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [guard.loading, guard.isGuest, talent.id]);

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
      else if (action === "start_conversation") openMessage();
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
        isFavorited={isFavorited}
        onToggleFavorite={toggleFavorite}
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
            <UgcSafetyTrust
              talentUserId={talent.id}
              talentName={talent.name}
              talentAvatar={talent.avatarUrl ?? null}
              onOpenBrief={() => setShowBrief(true)}
            />
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
