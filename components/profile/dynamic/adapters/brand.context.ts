// ─── PublicProfileDTO → BrandProfileContext ───────────────────────────────────
// PURE. No React. Mirrors talent.context.ts.
//
// Brands hold less state than talents: nothing is lifted, so unlike the talent
// builder this one takes no handlers and is a straight projection of the DTO.

import type { BrandPublicCore, PublicProfileDTO } from "@/features/profiles/types/dto";
import type { BrandProfileContext } from "./types";

export function buildBrandContextFromDTO(dto: PublicProfileDTO): BrandProfileContext {
  const core = dto.core as BrandPublicCore;

  return {
    typeSlug:    "brand",
    companyName: core.companyName ?? null,
    industry:    core.industry    ?? null,
    websiteUrl:  core.websiteUrl  ?? null,
    categoryId:  core.categoryId  ?? null,
    socialLinks: core.socialLinks ?? {},
    isApproved:  Boolean(core.isApproved),
    // The brand description lives on the shared `profiles` row, not on
    // brand_profiles — there is no core bio column to read.
    bio:         dto.identity.bio ?? null,
  };
}
