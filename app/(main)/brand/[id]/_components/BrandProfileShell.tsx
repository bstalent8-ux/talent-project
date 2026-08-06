"use client";

// ─── BrandProfileShell ────────────────────────────────────────────────────────
// The public brand page, rendered from a PublicProfileDTO through the
// layout-driven DynamicProfileRenderer. Mirrors TalentProfileShell.
//
// Owns only chrome: BrandHero, which carries the `logo` core section and must
// survive a profile with no other content — a brand page with no name is not a
// page. Everything else is decided by profile_layouts + the provider's
// hasContent rules.

import BrandHero from "@/components/profile/brand/BrandHero";
import DynamicProfileRenderer from "@/components/profile/dynamic/DynamicProfileRenderer";
import { useSite } from "@/contexts/SiteContext";
import type { BrandPublicCore, PublicProfileDTO } from "@/features/profiles/types/dto";

export default function BrandProfileShell({
  profile,
  completedBookings,
}: {
  profile:           PublicProfileDTO;
  /** Not part of the DTO: a collaboration count is a booking fact, not a profile one. */
  completedBookings: number;
}) {
  const { dark, lang } = useSite();
  const core = profile.core as BrandPublicCore;

  return (
    <main
      dir={lang === "en" ? "ltr" : "rtl"}
      style={{
        fontFamily:      "'Cairo', sans-serif",
        backgroundColor: dark ? "#050B12" : "#F1F5F9",
        minHeight:       "100vh",
        paddingBottom:   64,
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 24px" }}>
        <BrandHero
          avatarUrl={profile.identity.avatarUrl}
          city={profile.identity.city}
          companyName={core.companyName}
          completedBookings={completedBookings}
          isVerified={profile.identity.isVerified}
          memberSince={profile.identity.createdAt?.slice(0, 4) ?? null}
          name={profile.identity.fullName ?? "Brand"}
          websiteUrl={core.websiteUrl}
        />

        <DynamicProfileRenderer lang={lang === "en" ? "en" : "ar"} profile={profile} />
      </div>
    </main>
  );
}
