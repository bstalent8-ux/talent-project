export const runtime = 'edge';

import { adminClient } from "@/lib/supabase/admin";
import { CACHE_SECONDS, CACHE_TAGS, cachedPublic } from "@/lib/cache";
import { safePublicDisplayName } from "@/lib/public-display-name";
import BrandsClient from "./_components/BrandsClient";

export interface BrandCard {
  id: string;
  handle: string;
  name: string;
  avatar_url: string | null;
  city: string | null;
  industry: string | null;
  bio: string | null;
  verified: boolean;
  collab_count: number;
}

const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  fashion: ["fashion", "zara", "h&m", "style"],
  food:    ["food", "restaurant", "cafe", "uber eats", "talabat"],
  tech:    ["tech", "samsung", "apple", "digital", "software"],
  beauty:  ["beauty", "cosmetics", "skincare"],
  retail:  ["noon", "amazon", "souq", "retail", "shop"],
  media:   ["media", "tv", "radio", "studio", "channel"],
};

function detectIndustry(name: string, bio: string | null): string | null {
  const text = `${name} ${bio ?? ""}`.toLowerCase();
  for (const [industry, kws] of Object.entries(INDUSTRY_KEYWORDS)) {
    if (kws.some((kw) => text.includes(kw))) return industry;
  }
  return null;
}

async function fetchPublicBrands(): Promise<BrandCard[]> {
  const attempts = [
    "id, handle, full_name, avatar_url, city, bio, brand_category, brand_status, account_status, is_verified, is_approved",
    "id, handle, full_name, avatar_url, city, bio, brand_category, brand_status, is_verified, is_approved",
    "id, handle, full_name, avatar_url, city, bio, brand_status, is_verified, is_approved",
  ];

  let rows: any[] = [];
  for (const select of attempts) {
    const { data, error } = await adminClient
      .from("profiles")
      .select(select)
      .eq("role", "brand")
      .not("handle", "is", null);

    if (!error) {
      rows = data ?? [];
      break;
    }

    if (error.code !== "42703") break;
  }

  const publicRows = rows.filter((brand) => (
    !["blocked", "suspended", "rejected"].includes(brand.account_status ?? "active")
    && (!brand.brand_status || brand.brand_status === "approved")
  ));

  const brandIds = publicRows.map((brand) => brand.id);
  const collabMap: Record<string, number> = {};

  if (brandIds.length > 0) {
    const { data: bookings } = await adminClient
      .from("bookings")
      .select("brand_id")
      .in("brand_id", brandIds)
      .eq("status", "completed");

    for (const booking of bookings ?? []) {
      collabMap[booking.brand_id] = (collabMap[booking.brand_id] ?? 0) + 1;
    }
  }

  return publicRows.map((profile) => ({
    id:           profile.id,
    handle:       profile.handle,
    name:         safePublicDisplayName(profile.full_name, profile.handle, "Brand"),
    avatar_url:   profile.avatar_url ?? null,
    city:         profile.city ?? null,
    bio:          profile.bio ?? null,
    industry:     profile.brand_category ?? detectIndustry(profile.full_name ?? "", profile.bio),
    verified:     Boolean(profile.is_verified),
    collab_count: collabMap[profile.id] ?? 0,
  }));
}

export default async function BrandsPage() {
  const brands = await cachedPublic(
    ["brands-public-list"],
    [CACHE_TAGS.brands.list],
    CACHE_SECONDS.tenMinutes,
    fetchPublicBrands,
  );

  return <BrandsClient brands={brands} />;
}
