export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { normalizeCategoryId, setProfileCategories } from "@/features/categories/services/category.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, role, profileData, talentProfileData, categoryIds, brandProfileData } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: "userId and role are required" }, { status: 400 });
    }

    // profiles columns: id, handle, full_name, avatar_url, city, bio, role, brand_category
    const { error: profileErr } = await adminClient
      .from("profiles")
      .upsert({ id: userId, role, ...profileData });

    if (profileErr) {
      return NextResponse.json({ error: `profiles: ${profileErr.message}` }, { status: 500 });
    }

    // talent_profiles columns: user_id, category, specialties, social_links, bio, packages, availability, profile_views
    if (role === "talent" && talentProfileData) {
      const { error: talentErr } = await adminClient
        .from("talent_profiles")
        .upsert({ user_id: userId, ...talentProfileData }, { onConflict: "user_id" });

      if (talentErr) {
        return NextResponse.json({ error: `talent_profiles: ${talentErr.message}` }, { status: 500 });
      }
    }

    const normalizedCategoryIds = Array.isArray(categoryIds)
      ? categoryIds.map((id) => normalizeCategoryId(String(id))).filter(Boolean)
      : role === "talent" && talentProfileData?.category
        ? [normalizeCategoryId(String(talentProfileData.category))]
        : role === "brand" && brandProfileData?.category_id
          ? [normalizeCategoryId(String(brandProfileData.category_id))]
          : [];

    if (normalizedCategoryIds.length) {
      try {
        await setProfileCategories(userId, normalizedCategoryIds);
      } catch (categoryErr) {
        return NextResponse.json(
          { error: `profile_categories: ${categoryErr instanceof Error ? categoryErr.message : "save failed"}` },
          { status: 500 },
        );
      }
    }

    if (role === "brand") {
      const categoryId = normalizedCategoryIds[0] ?? normalizeCategoryId(brandProfileData?.category_id);
      const { error: brandErr } = await adminClient
        .from("brand_profiles")
        .upsert({
          user_id: userId,
          category_id: categoryId || null,
          company_name: profileData?.full_name ?? null,
          status: "pending",
          ...(brandProfileData ?? {}),
        }, { onConflict: "user_id" });

      if (brandErr) {
        return NextResponse.json({ error: `brand_profiles: ${brandErr.message}` }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
