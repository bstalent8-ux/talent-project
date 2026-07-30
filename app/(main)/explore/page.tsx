export const runtime = 'edge';

import { adminClient } from "@/lib/supabase/admin";
import { getCachedUser } from "@/lib/supabase/server";
import { normalizeCategoryId } from "@/features/categories/matching";
import {
  getCachedPublicTalentCards,
  type PublicTalentCard,
} from "@/features/talent-profile/services/public-talents.service";
import ExploreClient from "./_components/ExploreClient";

export type TalentCard = PublicTalentCard;

async function getViewerBrandCategory(): Promise<string | null> {
  try {
    const user = await getCachedUser();
    if (!user) return null;

    const { data: profile } = await adminClient
      .from("profiles")
      .select("role, brand_profiles!brand_profiles_user_id_fkey ( category_id, industry )")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "brand") return null;

    const bp = Array.isArray(profile.brand_profiles)
      ? profile.brand_profiles[0]
      : profile.brand_profiles;

    return normalizeCategoryId(bp?.category_id ?? bp?.industry) || null;
  } catch {
    return null;
  }
}

export default async function ExplorePage() {
  const [viewerBrandCategory, talents] = await Promise.all([
    getViewerBrandCategory(),
    getCachedPublicTalentCards(),
  ]);

  return <ExploreClient talents={talents} viewerBrandCategory={viewerBrandCategory} />;
}
