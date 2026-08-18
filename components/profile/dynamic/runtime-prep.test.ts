// ─── Dynamic runtime preparation tests ────────────────────────────────────────
// Covers the three pure pieces added in this phase: anchors, inline-core
// metadata, and the PublicProfileDTO → TalentProfileContext mapper.
//
// No DOM, no React renderer — every module under test is pure.

import { describe, expect, it, vi } from "vitest";

import { KNOWN_TAB_ANCHORS, SECTION_ANCHOR_ALIASES, anchorIdFor } from "./anchors";
import {
  INLINE_CORE_KEYS_BY_TYPE,
  TALENT_INLINE_CORE_KEYS,
  TALENT_RENDERABLE_CORE_KEYS,
  isInlineCoreKey,
  isRenderableCoreKey,
} from "./adapters/core-keys";
import {
  buildTalentContextFromDTO,
  toAddons,
  toPortfolioItems,
  toReviews,
  toTalentData,
} from "./adapters/talent.context";
import type { PublicProfileDTO } from "@/features/profiles/types/dto";

// ─── Fixture ──────────────────────────────────────────────────────────────────

const dto: PublicProfileDTO = {
  identity: {
    id: "p1",
    handle: "sara",
    fullName: "Sara",
    avatarUrl: "https://res.cloudinary.com/demo/a.jpg",
    city: "الإسكندرية",
    bio: "Bio text",
    isVerified: true,
    createdAt: "2023-05-01T00:00:00.000Z",
    typeSlug: "talent",
  },
  meta: {
    typeSlug: "talent",
    label: { ar: "موهبة", en: "Talent" },
    routePrefix: "talent",
    bookable: true,
  },
  core: {
    kind: "talent",
    category: "ugc",
    specialties: ["ugc", "reels"],
    availability: "available",
    availabilitySchedule: null,
    modelMetrics: {
      responseTimeLabel: null, responseRate: null, repeatClientRate: null,
      onTimeRate: null, avgProjectValue: null, noShowRate: null, tier: null,
    },
    packages: [{ id: "pkg1", name: "Basic", price: "1000", popular: true, features: ["a"] }],
    socialLinks: {
      title: "UGC Creator",
      fast_response: true,
      premium: false,
      usage_addons: [{ key: "wl", label: "Whitelisting", price: 500 }],
    },
    rating: 4.8,
    reviewCount: 2,
    totalBookings: 7,
    views: "12K",
    isFeatured: false,
    portfolio: [
      { id: "m1", url: "https://res.cloudinary.com/demo/b.jpg", mediaType: "image", caption: "cap", sortOrder: 0, isApproved: true },
    ],
    reviews: [
      { id: "r1", author: "Acme Co", rating: 5, text: "Great", createdAt: "2026-02-01T00:00:00.000Z" },
    ],
    brands: [],
    bookingStats: { total: 7, completed: 5, pending: 1, cancelled: 1 },
    identityVerified: false,
  },
  sections: [],
  layout: { main: [], sidebar: [] },
  isBookable: true,
};

// ─── Anchors ──────────────────────────────────────────────────────────────────

describe("section anchors", () => {
  it("defaults to section-{key}", () => {
    expect(anchorIdFor("portfolio")).toBe("section-portfolio");
    expect(anchorIdFor("packages")).toBe("section-packages");
    expect(anchorIdFor("experience")).toBe("section-experience");
  });

  it("aliases the two keys whose anchor differs from their key", () => {
    // TalentModelProfile.tsx:101 renders UsageRightsSection under #section-usage
    expect(anchorIdFor("usage_addons")).toBe("section-usage");
    // TalentModelProfile.tsx:97 uses #section-about as the bio target
    expect(anchorIdFor("bio")).toBe("section-about");
  });

  it("produces every anchor TabsNavigation targets", () => {
    const produced = new Set([
      anchorIdFor("bio"),
      anchorIdFor("portfolio"),
      anchorIdFor("experience"),
      anchorIdFor("packages"),
      anchorIdFor("usage_addons"),
    ]);

    for (const anchor of KNOWN_TAB_ANCHORS) {
      expect(produced.has(anchor), `missing ${anchor}`).toBe(true);
    }
  });

  it("never returns a bare or duplicated id for distinct keys", () => {
    const keys = [...TALENT_RENDERABLE_CORE_KEYS, ...TALENT_INLINE_CORE_KEYS, "equipment", "awards"];
    const seen = new Map<string, string>();

    for (const key of keys) {
      const anchor = anchorIdFor(key);
      expect(anchor.startsWith("section-")).toBe(true);
      expect(anchor.length).toBeGreaterThan("section-".length);

      // hero/avatar/personal legitimately differ; only aliased keys may collide.
      const previous = seen.get(anchor);
      if (previous) {
        expect(
          SECTION_ANCHOR_ALIASES[key] || SECTION_ANCHOR_ALIASES[previous],
          `unexpected anchor collision: ${previous} and ${key} → ${anchor}`,
        ).toBeTruthy();
      }
      seen.set(anchor, key);
    }
  });
});

// ─── Inline core metadata ─────────────────────────────────────────────────────

describe("inline core sections", () => {
  it.each(TALENT_INLINE_CORE_KEYS)("%s is inline and not renderable", (key) => {
    expect(isInlineCoreKey("talent", key)).toBe(true);
    expect(isRenderableCoreKey("talent", key)).toBe(false);
  });

  it.each(TALENT_RENDERABLE_CORE_KEYS)("%s is renderable and not inline", (key) => {
    expect(isRenderableCoreKey("talent", key)).toBe(true);
    expect(isInlineCoreKey("talent", key)).toBe(false);
  });

  it("returns false for an unknown profile type instead of throwing", () => {
    expect(isInlineCoreKey("agency", "bio")).toBe(false);
    expect(isRenderableCoreKey("agency", "bio")).toBe(false);
  });

  // Every brand core key must be classified one way or the other. An
  // unclassified key is the only case that reaches CoreSectionPlaceholder,
  // which tells a visitor something is broken when nothing is.
  it("brand core keys are all classified, so brand sections never show placeholders", () => {
    expect(INLINE_CORE_KEYS_BY_TYPE.brand.length).toBeGreaterThan(0);
    // `logo` is carried by BrandHero as page chrome, not by a layout slot.
    expect(isInlineCoreKey("brand", "logo")).toBe(true);

    for (const key of ["bio", "company_info", "industry", "social", "verification"]) {
      expect(isRenderableCoreKey("brand", key), `brand "${key}" should be renderable`).toBe(true);
      expect(isInlineCoreKey("brand", key)).toBe(false);
    }
  });
});

// ─── DTO → adapter context ────────────────────────────────────────────────────

describe("buildTalentContextFromDTO", () => {
  const onSelectPackage = vi.fn();

  it("maps identity and core onto TalentData", () => {
    const talent = toTalentData(dto);

    expect(talent.id).toBe("p1");
    expect(talent.name).toBe("Sara");
    expect(talent.handle).toBe("sara");
    expect(talent.title).toBe("UGC Creator");
    expect(talent.rating).toBe(4.8);
    expect(talent.reviewCount).toBe(2);
    expect(talent.verified).toBe(true);
    expect(talent.fastResponse).toBe(true);
    expect(talent.premium).toBe(false);
    expect(talent.specialties).toEqual(["ugc", "reels"]);
  });

  it("derives location and memberSince the same way the existing transformer does", () => {
    expect(toTalentData(dto).location).toBe("الإسكندرية، مصر");
    expect(toTalentData(dto).memberSince).toBe("2023");

    const noCity = { ...dto, identity: { ...dto.identity, city: null } };
    expect(toTalentData(noCity).location).toBe("القاهرة، مصر");
  });

  it("converts portfolio DTO keys back to the component's snake_case shape", () => {
    expect(toPortfolioItems(dto)).toEqual([
      { id: "m1", url: "https://res.cloudinary.com/demo/b.jpg", media_type: "image", caption: "cap", sort_order: 0 },
    ]);
  });

  it("reads add-ons out of the social_links blob", () => {
    expect(toAddons(dto)).toEqual([{ key: "wl", label: "Whitelisting", price: 500 }]);
  });

  it("returns null add-ons when the blob has none", () => {
    const bare = { ...dto, core: { ...dto.core, socialLinks: {} } } as PublicProfileDTO;
    expect(toAddons(bare)).toBeNull();
  });

  it("carries reviewer names through — the parity fix", () => {
    const reviews = toReviews(dto);
    expect(reviews).toHaveLength(1);
    expect(reviews[0].author).toBe("Acme Co");
    expect(reviews[0].author).not.toBe("Client");
  });

  it("keeps selectedPackage as caller-owned state, not DTO-derived", () => {
    const context = buildTalentContextFromDTO(dto, { selectedPackage: null, onSelectPackage });
    expect(context.selectedPackage).toBeNull();

    const pkg = (dto.core as { packages: { id: string }[] }).packages[0];
    const withSelection = buildTalentContextFromDTO(dto, {
      selectedPackage: pkg as never,
      onSelectPackage,
    });
    expect(withSelection.selectedPackage).toEqual(pkg);
  });

  it("wires onSelectPackage straight through to the caller", () => {
    const context = buildTalentContextFromDTO(dto, { selectedPackage: null, onSelectPackage });
    const pkg = (dto.core as { packages: unknown[] }).packages[0];
    context.onSelectPackage(pkg as never);
    expect(onSelectPackage).toHaveBeenCalledWith(pkg);
  });

  it("produces a talent-typed context", () => {
    const context = buildTalentContextFromDTO(dto, { selectedPackage: null, onSelectPackage });
    expect(context.typeSlug).toBe("talent");
  });
});
