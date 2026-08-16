// ─── Core section adapter tests ───────────────────────────────────────────────
// Targets the PURE prop builders, so no DOM, no React renderer and no jsdom
// dependency is needed. The JSX half is covered by the compiler:
// CoreSectionRenderPlan types `props` as the real component prop types, so a
// mismatch fails `npx tsc --noEmit`.

import { describe, expect, it, vi } from "vitest";

import {
  BRAND_INLINE_CORE_KEYS,
  BRAND_RENDERABLE_CORE_KEYS,
  INLINE_CORE_KEYS_BY_TYPE,
  RENDERABLE_CORE_KEYS_BY_TYPE,
  TALENT_INLINE_CORE_KEYS,
  TALENT_RENDERABLE_CORE_KEYS,
} from "./core-keys";
import { buildTalentCoreProps, supportsTalentCoreKey } from "./talent.props";
import { buildBrandCoreProps, supportsBrandCoreKey } from "./brand.props";
import type { BrandProfileContext, TalentProfileContext } from "./types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const onSelectPackage = vi.fn();

const talentContext: TalentProfileContext = {
  typeSlug: "talent",
  talent: {
    id: "t1",
    name: "Sara",
    handle: "sara",
    avatarUrl: null,
    title: "UGC Creator",
    location: "القاهرة، مصر",
    memberSince: "2023",
    rating: 4.8,
    reviewCount: 12,
    views: "12K",
    verified: true,
    fastResponse: false,
    premium: false,
    bio: "Bio",
    specialties: ["ugc"],
    category: "ugc",
  },
  portfolioItems: [
    { id: "p1", url: "https://res.cloudinary.com/demo/a.jpg", media_type: "image", caption: null, sort_order: 0 },
  ],
  packages: [{ id: "pkg1", name: "Basic", price: "1000", popular: true, features: ["one"] }],
  addons: [{ key: "wl", label: "Whitelisting", price: 500 }],
  reviews: [{ id: "r1", author: "Brand", brand: "", rating: 5, text: "Great", date: "2026" }],
  experience: [{ name: "Acme", year: "2025", verified: true }],
  brands: [{ id: "b1", name: "Acme", logo_url: null, year_collaborated: "2025", sort_order: 0 }],
  bookingStats: { total: 7, completed: 5, pending: 1, cancelled: 1 },
  selectedPackage: null,
  onSelectPackage,
  presenceLinks: { instagram: "https://instagram.com/sara" },
  measurements: { height: "170", eye_color: "بني" },
};

const brandContext: BrandProfileContext = {
  typeSlug: "brand",
  companyName: "Acme",
  industry: "retail",
  websiteUrl: "https://example.com",
  isApproved: true,
  bio: "We make things.",
  categoryId: "retail",
  socialLinks: { instagram: "acme" },
};

// ─── 1. Every renderable core section has an adapter entry ────────────────────

describe("every core section has an adapter", () => {
  it.each(TALENT_RENDERABLE_CORE_KEYS)(
    "talent core section %s resolves to a render plan",
    (key) => {
      expect(supportsTalentCoreKey(key)).toBe(true);

      const plan = buildTalentCoreProps(key, talentContext);
      expect(plan).not.toBeNull();
      expect(plan!.component).toBeTruthy();
      expect(plan!.props).toBeTypeOf("object");
    },
  );

  it("talent adapter claims exactly the declared renderable keys", () => {
    const claimed = [...TALENT_RENDERABLE_CORE_KEYS].filter(supportsTalentCoreKey);
    expect(claimed).toEqual([...TALENT_RENDERABLE_CORE_KEYS]);
  });

  it.each(BRAND_RENDERABLE_CORE_KEYS)(
    "brand core section %s resolves to a render plan",
    (key) => {
      expect(supportsBrandCoreKey(key)).toBe(true);

      const plan = buildBrandCoreProps(key, brandContext);
      expect(plan).not.toBeNull();
      expect(plan!.component).toBeTruthy();
      expect(plan!.props).toBeTypeOf("object");
    },
  );

  it("brand adapter claims exactly the declared renderable keys", () => {
    const claimed = [...BRAND_RENDERABLE_CORE_KEYS].filter(supportsBrandCoreKey);
    expect(claimed).toEqual([...BRAND_RENDERABLE_CORE_KEYS]);
  });

  // `logo` is carried by BrandHero as page chrome. If it ever starts resolving
  // to a plan it would render twice — once in the hero, once in a slot.
  it("brand `logo` stays unclaimed", () => {
    expect(supportsBrandCoreKey("logo")).toBe(false);
    expect(buildBrandCoreProps("logo", brandContext)).toBeNull();
  });

  it("renderable and inline key sets never overlap", () => {
    for (const [typeSlug, renderable] of Object.entries(RENDERABLE_CORE_KEYS_BY_TYPE)) {
      const inline = new Set(INLINE_CORE_KEYS_BY_TYPE[typeSlug] ?? []);
      for (const key of renderable) {
        expect(inline.has(key), `${typeSlug}: "${key}" is in both sets`).toBe(false);
      }
    }
  });
});

// ─── 2. Unknown / inline core sections fail safely ────────────────────────────

describe("unknown core section fails safely", () => {
  it.each(["", "not_a_section", "HERO", "hero ", "packages;drop", "__proto__", "constructor"])(
    "returns null for %j instead of throwing",
    (key) => {
      expect(() => buildTalentCoreProps(key, talentContext)).not.toThrow();
      expect(buildTalentCoreProps(key, talentContext)).toBeNull();
      expect(supportsTalentCoreKey(key)).toBe(false);
    },
  );

  it.each(TALENT_INLINE_CORE_KEYS)(
    "inline talent key %s is unclaimed and returns null",
    (key) => {
      expect(supportsTalentCoreKey(key)).toBe(false);
      expect(buildTalentCoreProps(key, talentContext)).toBeNull();
    },
  );

  it.each(BRAND_INLINE_CORE_KEYS)("inline brand key %s returns null", (key) => {
    expect(supportsBrandCoreKey(key)).toBe(false);
    expect(buildBrandCoreProps(key, brandContext)).toBeNull();
  });

  it("brand adapter returns null for a key the talent adapter does claim", () => {
    expect(buildBrandCoreProps("portfolio", brandContext)).toBeNull();
  });
});

// ─── 3. Adapter output matches component prop requirements ────────────────────
// The compiler already enforces the shapes; these assert the VALUES are the
// ones TalentModelProfile passes today, so swapping in the dynamic renderer is
// behaviour-neutral.

describe("adapter output matches component prop requirements", () => {
  it("hero / avatar / personal all map to ProfileHero with the talent object", () => {
    for (const key of ["hero", "avatar", "personal"]) {
      const plan = buildTalentCoreProps(key, talentContext)!;
      expect(plan.component).toBe("ProfileHero");
      expect(plan.props).toEqual({ talent: talentContext.talent });
    }
  });

  it("portfolio maps to PortfolioSection with portfolioItems, default variant for a non-model category", () => {
    const plan = buildTalentCoreProps("portfolio", talentContext)!;
    expect(plan.component).toBe("PortfolioSection");
    expect(plan.props).toEqual({ portfolioItems: talentContext.portfolioItems, variant: "default" });
  });

  it("portfolio maps to the model variant when talent.category is model", () => {
    const modelContext: TalentProfileContext = { ...talentContext, talent: { ...talentContext.talent, category: "model" } };
    const plan = buildTalentCoreProps("portfolio", modelContext)!;
    expect((plan.props as { variant: string }).variant).toBe("model");
  });

  it("experience maps to ExperienceSection, default variant for a non-model category", () => {
    const plan = buildTalentCoreProps("experience", talentContext)!;
    expect(plan.component).toBe("ExperienceSection");
    expect(plan.props).toEqual({ experience: talentContext.experience, variant: "default" });
  });

  it("experience maps to the model variant when talent.category is model", () => {
    const modelContext: TalentProfileContext = { ...talentContext, talent: { ...talentContext.talent, category: "model" } };
    const plan = buildTalentCoreProps("experience", modelContext)!;
    expect((plan.props as { variant: string }).variant).toBe("model");
  });

  it("brands maps to BrandsCard, default variant for a non-model category", () => {
    const plan = buildTalentCoreProps("brands", talentContext)!;
    expect(plan.component).toBe("BrandsCard");
    expect(plan.props).toEqual({ brands: talentContext.brands, variant: "default" });
  });

  it("brands maps to the model variant when talent.category is model", () => {
    const modelContext: TalentProfileContext = { ...talentContext, talent: { ...talentContext.talent, category: "model" } };
    const plan = buildTalentCoreProps("brands", modelContext)!;
    expect((plan.props as { variant: string }).variant).toBe("model");
  });

  it("packages maps to PackagesSection with the onSelect callback wired", () => {
    const plan = buildTalentCoreProps("packages", talentContext)!;
    expect(plan.component).toBe("PackagesSection");

    const props = plan.props as { onSelect: (pkg: unknown) => void; packages: unknown };
    expect(props.packages).toEqual(talentContext.packages);
    expect(props.onSelect).toBeTypeOf("function");

    // The lifted-state contract: PackagesSection.onSelect must reach the
    // context handler, because UsageRightsSection reads selectedPackage.
    props.onSelect(talentContext.packages![0]);
    expect(onSelectPackage).toHaveBeenCalledWith(talentContext.packages![0]);
  });

  it("packages defaults to variant 'default' for a non-model category", () => {
    const plan = buildTalentCoreProps("packages", talentContext)!;
    expect((plan.props as { variant: string }).variant).toBe("default");
  });

  it("packages maps to the model variant when talent.category is model", () => {
    const modelContext: TalentProfileContext = { ...talentContext, talent: { ...talentContext.talent, category: "model" } };
    const plan = buildTalentCoreProps("packages", modelContext)!;
    expect((plan.props as { variant: string }).variant).toBe("model");
  });

  it("usage_addons maps to UsageRightsSection with selectedPackage and addons", () => {
    const plan = buildTalentCoreProps("usage_addons", talentContext)!;
    expect(plan.component).toBe("UsageRightsSection");
    expect(plan.props).toEqual({
      selectedPackage: talentContext.selectedPackage,
      addons:          talentContext.addons,
    });
  });

  it("usage_addons reflects a selected package rather than caching null", () => {
    const withSelection: TalentProfileContext = {
      ...talentContext,
      selectedPackage: talentContext.packages![0],
    };
    const plan = buildTalentCoreProps("usage_addons", withSelection)!;
    expect((plan.props as { selectedPackage: unknown }).selectedPackage)
      .toEqual(talentContext.packages![0]);
  });

  it("reviews maps to ReviewsCard with reviews, the talent rating, default variant for a non-model category", () => {
    const plan = buildTalentCoreProps("reviews", talentContext)!;
    expect(plan.component).toBe("ReviewsCard");
    expect(plan.props).toEqual({
      reviews: talentContext.reviews,
      rating:  talentContext.talent.rating,
      variant: "default",
    });
  });

  it("reviews maps to the model variant when talent.category is model", () => {
    const modelContext: TalentProfileContext = { ...talentContext, talent: { ...talentContext.talent, category: "model" } };
    const plan = buildTalentCoreProps("reviews", modelContext)!;
    expect((plan.props as { variant: string }).variant).toBe("model");
  });

  it("social maps to ProfessionalPresenceSection with the filled presence links", () => {
    const plan = buildTalentCoreProps("social", talentContext)!;
    expect(plan.component).toBe("ProfessionalPresenceSection");
    expect(plan.props).toEqual({ links: talentContext.presenceLinks });
  });

  it("social returns null when no presence links are filled", () => {
    const withoutPresence: TalentProfileContext = { ...talentContext, presenceLinks: {} };
    expect(buildTalentCoreProps("social", withoutPresence)).toBeNull();
  });

  it("physical maps to MeasurementsSection with the Model measurements", () => {
    const plan = buildTalentCoreProps("physical", talentContext)!;
    expect(plan.component).toBe("MeasurementsSection");
    expect(plan.props).toEqual({ measurements: talentContext.measurements });
  });

  it("physical returns null when there are no measurements (e.g. category is not model)", () => {
    const withoutMeasurements: TalentProfileContext = { ...talentContext, measurements: null };
    expect(buildTalentCoreProps("physical", withoutMeasurements)).toBeNull();
  });

  it("trust maps to TrustCard, which takes no props", () => {
    const plan = buildTalentCoreProps("trust", talentContext)!;
    expect(plan.component).toBe("TrustCard");
    expect(plan.props).toEqual({});
  });

  it("builders are pure — they never mutate the context", () => {
    const snapshot = JSON.stringify(talentContext, (key, value) =>
      key === "onSelectPackage" ? "fn" : value,
    );

    for (const key of TALENT_RENDERABLE_CORE_KEYS) buildTalentCoreProps(key, talentContext);

    const after = JSON.stringify(talentContext, (key, value) =>
      key === "onSelectPackage" ? "fn" : value,
    );
    expect(after).toBe(snapshot);
  });
});
