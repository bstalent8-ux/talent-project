export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { normalizeCategoryId, setProfileCategories } from "@/features/categories/services/category.service";

// ─── Mass-assignment guards ──────────────────────────────────────────────────
// This route writes through the service role (RLS bypassed), so the caller must
// never be able to set moderation / trust / money columns on itself.
// Column names verified against the live schema — an unknown key here makes
// PostgREST reject the whole write with a 400.
const PROFILE_FIELDS = [
  "handle", "full_name", "avatar_url", "city", "bio", "phone_number", "phone",
] as const;

const TALENT_FIELDS = [
  "category", "specialties", "social_links", "bio", "packages", "availability",
] as const;

const BRAND_FIELDS = [
  "company_name", "category_id", "industry", "website_url", "social_links",
] as const;

const ALLOWED_ROLES = ["talent", "brand"] as const;

function pick<T extends Record<string, unknown>>(src: unknown, keys: readonly string[]): T {
  const out: Record<string, unknown> = {};
  if (src && typeof src === "object") {
    for (const k of keys) {
      if (k in (src as Record<string, unknown>)) out[k] = (src as Record<string, unknown>)[k];
    }
  }
  return out as T;
}

export async function POST(req: NextRequest) {
  try {
    // ── 1. Authenticate ──────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json();
    const { userId, role, profileData, talentProfileData, categoryIds, brandProfileData } = body;

    // A caller may only ever write its own profile.
    if (userId && userId !== user.id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const targetId = user.id;

    // ── 2. Resolve the effective role ────────────────────────────────────────
    // Role is only accepted when the profile does not exist yet; afterwards the
    // stored role wins so nobody can promote themselves.
    const { data: existing } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", targetId)
      .maybeSingle();

    let effectiveRole: string;
    if (existing?.role) {
      effectiveRole = existing.role;
    } else {
      if (!ALLOWED_ROLES.includes(role)) {
        return NextResponse.json({ error: "role must be talent or brand" }, { status: 400 });
      }
      effectiveRole = role;
    }

    // profiles columns: id, handle, full_name, avatar_url, city, bio, role, brand_category
    const { error: profileErr } = await adminClient
      .from("profiles")
      .upsert({ ...pick(profileData, PROFILE_FIELDS), id: targetId, role: effectiveRole });

    if (profileErr) {
      return NextResponse.json({ error: `profiles: ${profileErr.message}` }, { status: 500 });
    }

    // talent_profiles columns: user_id, category, specialties, social_links, bio, packages, availability
    if (effectiveRole === "talent" && talentProfileData) {
      const { error: talentErr } = await adminClient
        .from("talent_profiles")
        .upsert({ ...pick(talentProfileData, TALENT_FIELDS), user_id: targetId }, { onConflict: "user_id" });

      if (talentErr) {
        return NextResponse.json({ error: `talent_profiles: ${talentErr.message}` }, { status: 500 });
      }
    }

    const normalizedCategoryIds = Array.isArray(categoryIds)
      ? categoryIds.map((id) => normalizeCategoryId(String(id))).filter(Boolean)
      : effectiveRole === "talent" && talentProfileData?.category
        ? [normalizeCategoryId(String(talentProfileData.category))]
        : effectiveRole === "brand" && brandProfileData?.category_id
          ? [normalizeCategoryId(String(brandProfileData.category_id))]
          : [];

    if (normalizedCategoryIds.length) {
      try {
        await setProfileCategories(targetId, normalizedCategoryIds);
      } catch (categoryErr) {
        return NextResponse.json(
          { error: `profile_categories: ${categoryErr instanceof Error ? categoryErr.message : "save failed"}` },
          { status: 500 },
        );
      }
    }

    if (effectiveRole === "brand") {
      const categoryId = normalizedCategoryIds[0] ?? normalizeCategoryId(brandProfileData?.category_id);

      // `status` is moderation state — only seed it on creation, never on edit,
      // otherwise saving a profile silently sends an approved brand back to pending.
      const { data: existingBrand } = await adminClient
        .from("brand_profiles")
        .select("user_id")
        .eq("user_id", targetId)
        .maybeSingle();

      const { error: brandErr } = await adminClient
        .from("brand_profiles")
        .upsert({
          ...pick(brandProfileData, BRAND_FIELDS),
          user_id:      targetId,
          category_id:  categoryId || null,
          company_name: profileData?.full_name ?? brandProfileData?.company_name ?? null,
          ...(existingBrand ? {} : { status: "pending" }),
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
