export const runtime = 'edge';

export const dynamic = "force-dynamic";

import { adminClient } from "@/lib/supabase/admin";
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
  fashion: ["fashion","zara","h&m","style","أزياء","فاشن","ملابس","موضة"],
  food:    ["food","restaurant","مطعم","طعام","cafe","كافيه","uber eats","talabat","طلبات"],
  tech:    ["tech","samsung","apple","digital","تقنية","تكنولوجيا","software"],
  beauty:  ["beauty","loreal","l'oréal","جمال","cosmetics","skincare","عناية"],
  retail:  ["noon","amazon","souq","retail","تجزئة","متجر","shop"],
  media:   ["media","tv","radio","مذياع","تلفزيون","إعلام","studio","channel"],
};

function detectIndustry(name: string, bio: string | null): string | null {
  const text = `${name} ${bio ?? ""}`.toLowerCase();
  for (const [industry, kws] of Object.entries(INDUSTRY_KEYWORDS)) {
    if (kws.some((kw) => text.includes(kw))) return industry;
  }
  return null;
}

export default async function BrandsPage() {
  const { data } = await adminClient
    .from("profiles")
    .select("id, handle, full_name, avatar_url, city, bio, is_verified, is_approved")
    .eq("role", "brand")
    .not("handle", "is", null);

  // Count completed bookings per brand
  const brandIds = (data ?? []).map((b) => b.id);
  let collabMap: Record<string, number> = {};
  if (brandIds.length > 0) {
    const { data: bookings } = await adminClient
      .from("bookings")
      .select("brand_id")
      .in("brand_id", brandIds)
      .eq("status", "completed");
    for (const b of bookings ?? []) {
      collabMap[b.brand_id] = (collabMap[b.brand_id] ?? 0) + 1;
    }
  }

  const brands: BrandCard[] = (data ?? []).map((p) => ({
    id: p.id,
    handle: p.handle!,
    name: p.full_name ?? "—",
    avatar_url: p.avatar_url ?? null,
    city: p.city ?? null,
    bio: p.bio ?? null,
    industry: detectIndustry(p.full_name ?? "", p.bio),
    verified: Boolean(p.is_verified),
    collab_count: collabMap[p.id] ?? 0,
  }));

  return <BrandsClient brands={brands} />;
}