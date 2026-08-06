"use client";

// ─── DynamicProfileContext ────────────────────────────────────────────────────
// Owns the shared renderer state that section components need but that no
// single section can hold:
//
//   • the profile DTO
//   • the render language
//   • selectedPackage / setSelectedPackage   (lifted, exactly as
//     TalentModelProfile.tsx:70 owns it today)
//   • booking actions
//
// PackagesSection sets the selected package, UsageRightsSection prices against
// it, and StickyBookingBar books it — so it cannot live inside any of them.
//
// Existing components receive these values as their normal props, through the
// adapters. None of them is aware this context exists.

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { PublicProfileDTO } from "@/features/profiles/types/dto";
import type { PackageItem } from "@/features/talent-profile/types";
import { buildBrandContextFromDTO } from "./adapters/brand.context";
import { buildTalentContextFromDTO } from "./adapters/talent.context";
import type { ProfileContext } from "./adapters/types";
import type { DynamicLang } from "./registry";

/** Booking entry points. Optional: the runtime test page passes no-ops. */
export interface BookingActions {
  onBook?:    (pkg: PackageItem | null) => void;
  onMessage?: () => void;
}

export interface DynamicProfileState {
  profile:            PublicProfileDTO;
  lang:               DynamicLang;
  typeSlug:           string;
  selectedPackage:    PackageItem | null;
  setSelectedPackage: (pkg: PackageItem | null) => void;
  booking:            BookingActions;
  /** Adapter-ready context, rebuilt when the DTO or selection changes. */
  adapterContext:     ProfileContext | null;
}

const DynamicProfileCtx = createContext<DynamicProfileState | null>(null);

export function useDynamicProfile(): DynamicProfileState {
  const value = useContext(DynamicProfileCtx);
  if (!value) {
    throw new Error("useDynamicProfile must be used inside <DynamicProfileProvider>");
  }
  return value;
}

/** Non-throwing variant, for components that may render outside a profile. */
export function useDynamicProfileOptional(): DynamicProfileState | null {
  return useContext(DynamicProfileCtx);
}

export function DynamicProfileProvider({
  profile,
  lang,
  booking = {},
  children,
}: {
  profile:  PublicProfileDTO;
  lang:     DynamicLang;
  booking?: BookingActions;
  children: ReactNode;
}) {
  const [selectedPackage, setSelectedPackage] = useState<PackageItem | null>(null);

  const typeSlug = profile.meta.typeSlug;

  const onSelectPackage = useCallback((pkg: PackageItem) => {
    setSelectedPackage(pkg);
  }, []);

  // One branch per registered core adapter. An unregistered type gets null and
  // falls through to the placeholder / dynamic renderers rather than throwing.
  //
  // Only the talent context depends on `selectedPackage`; the brand branch is
  // memoized on the DTO alone so selecting a package cannot rebuild it.
  const adapterContext = useMemo<ProfileContext | null>(() => {
    if (typeSlug === "talent") {
      return buildTalentContextFromDTO(profile, { selectedPackage, onSelectPackage });
    }
    if (typeSlug === "brand") return buildBrandContextFromDTO(profile);
    return null;
  }, [profile, typeSlug, selectedPackage, onSelectPackage]);

  const value = useMemo<DynamicProfileState>(
    () => ({
      profile,
      lang,
      typeSlug,
      selectedPackage,
      setSelectedPackage,
      booking,
      adapterContext,
    }),
    [profile, lang, typeSlug, selectedPackage, booking, adapterContext],
  );

  return <DynamicProfileCtx.Provider value={value}>{children}</DynamicProfileCtx.Provider>;
}
