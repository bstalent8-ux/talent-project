import type {
  RawProfile,
  RawTalentProfile,
  RawPortfolioItem,
  RawReview,
  TalentPageData,
  TalentData,
  CampaignStats,
  FeaturedCampaign,
  ExperienceItem,
  Review,
  BrandItem,
  PackageItem,
  AddonItem,
  PortfolioItem,
} from "../types";

// BrandItem is now fetched separately from talent_brands table
// and passed in directly — no transformation needed from social_links


// ─── Individual field transformers ────────────────────────────────────────────

function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${Math.round(views / 1_000)}K`;
  return String(views);
}

function transformTalentData(profile: RawProfile, tp: RawTalentProfile | null, sl: Record<string, unknown>): TalentData {
  return {
    id: profile.id,
    name: profile.full_name ?? "Talent",
    handle: profile.handle ?? "",
    avatarUrl: profile.avatar_url ?? null,
    title: (sl.title as string) ?? tp?.category ?? "",
    location: profile.city ? `${profile.city}، مصر` : "القاهرة، مصر",
    memberSince: (sl.member_since as string) ?? profile.created_at?.slice(0, 4) ?? "2022",
    rating: tp?.avg_rating ?? 0,
    reviewCount: tp?.total_reviews ?? 0,
    views: (sl.views_display as string) ?? formatViews(tp?.profile_views ?? 0),
    verified: Boolean(profile.is_verified),
    fastResponse: Boolean(sl.fast_response),
    premium: Boolean(sl.premium),
    bio: profile.bio ?? tp?.bio ?? null,
    specialties: tp?.specialties ?? [],
    category: tp?.category ?? null,
  };
}

function transformReviews(raw: RawReview[]): Review[] {
  return raw.map((r) => {
    const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    return {
      id: r.id,
      author: profile?.full_name ?? "Client",
      brand: "",
      rating: r.rating,
      text: r.comment ?? "",
      date: new Date(r.created_at).toLocaleDateString("ar-EG", { month: "long", year: "numeric" }),
    };
  });
}

function transformExperience(sl: Record<string, unknown>): ExperienceItem[] | null {
  if (!Array.isArray(sl.experience)) return null;
  return (sl.experience as Array<Record<string, unknown>>).map((e) => ({
    name: String(e.name ?? ""),
    year: String(e.year ?? ""),
    verified: Boolean(e.verified),
  }));
}

function transformPackages(raw: unknown): PackageItem[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const parsed: PackageItem[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    if (!r.id || !r.name || !r.price) continue;
    parsed.push({
      id: String(r.id),
      name: String(r.name),
      price: String(r.price),
      popular: Boolean(r.popular),
      features: Array.isArray(r.features) ? r.features.map(String) : [],
    });
  }
  return parsed.length > 0 ? parsed : null;
}

function transformCampaignStats(sl: Record<string, unknown>): CampaignStats | null {
  const raw = sl.campaign_stats as Record<string, string> | undefined;
  if (!raw) return null;
  return {
    views: raw.views ?? "—",
    ctr: raw.ctr ?? "—",
    sales_increase: raw.sales_increase ?? "—",
    repeat: raw.repeat ?? "—",
  };
}

function transformFeaturedCampaign(sl: Record<string, unknown>): FeaturedCampaign | null {
  const raw = sl.featured_campaign as Record<string, string> | undefined;
  if (!raw) return null;
  return {
    name: raw.name ?? "—",
    ctr_before: raw.ctr_before ?? "—",
    ctr_after: raw.ctr_after ?? "—",
    growth: raw.growth ?? "—",
  };
}

function transformAddons(sl: Record<string, unknown>): AddonItem[] | null {
  const raw = sl.usage_addons;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const parsed: AddonItem[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    if (!r.label) continue;
    parsed.push({ key: String(r.key ?? crypto.randomUUID()), label: String(r.label), price: Number(r.price ?? 0) });
  }
  return parsed.length > 0 ? parsed : null;
}

function transformPortfolioItems(raw: RawPortfolioItem[]): PortfolioItem[] {
  return raw.map((item) => ({
    id: item.id,
    url: item.url,
    media_type: item.media_type,
    caption: item.caption,
    sort_order: item.sort_order,
  }));
}

// ─── Main transformer ─────────────────────────────────────────────────────────

function transformBrands(sl: Record<string, unknown>): BrandItem[] {
  const raw = sl.brands;
  if (!Array.isArray(raw) || raw.length === 0) return [];
  return (raw as string[]).filter(Boolean).map((name, i) => ({
    id: `sl-${i}`,
    name,
    logo_url: null,
    year_collaborated: null,
    sort_order: i,
  }));
}

export function transformTalentPageData(
  profile: RawProfile,
  tp: RawTalentProfile | null,
  rawPortfolio: RawPortfolioItem[],
  rawReviews: RawReview[] = []
): TalentPageData {
  const sl = (tp?.social_links ?? {}) as Record<string, unknown>;

  return {
    talent: transformTalentData(profile, tp, sl),
    brands: transformBrands(sl),
    reviews: transformReviews(rawReviews),
    experience: transformExperience(sl),
    packages: transformPackages(tp?.packages),
    addons: transformAddons(sl),
    portfolioItems: transformPortfolioItems(rawPortfolio),
    campaignStats: transformCampaignStats(sl),
    featuredCampaign: transformFeaturedCampaign(sl),
  };
}
