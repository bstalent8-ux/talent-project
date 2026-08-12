export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { fetchCategories, normalizeCategoryId, setProfileCategories } from "@/features/categories/services/category.service";
import { invalidateBrand, invalidateTalent, privateNoStoreHeaders } from "@/lib/cache";
import { ProfileError, profileService } from "@/features/profiles";

// ─── Mass-assignment guards ──────────────────────────────────────────────────
// This route writes through the service role (RLS bypassed), so the caller must
// never be able to set moderation / trust / money columns on itself.
// Column names verified against the live schema — an unknown key here makes
// PostgREST reject the whole write with a 400.
//
// PROFILE_FIELDS still lives here because this route owns the shared `profiles`
// row. The per-role core allowlists moved to the providers
// (features/profiles/providers/*.provider.ts → meta.writableCoreFields), which
// hold byte-identical copies of the former TALENT_FIELDS / BRAND_FIELDS.
const PROFILE_FIELDS = [
  "handle", "full_name", "avatar_url", "city", "bio", "phone_number", "phone",
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
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: privateNoStoreHeaders() });

    const body = await req.json();
    const { userId, role, profileData, talentProfileData, categoryIds, brandProfileData } = body;

    // A caller may only ever write its own profile.
    if (userId && userId !== user.id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403, headers: privateNoStoreHeaders() });
    }
    const targetId = user.id;

    // ── 2. Resolve the effective role ────────────────────────────────────────
    // Role is only accepted when the profile does not exist yet; afterwards the
    // stored role wins so nobody can promote themselves.
    const { data: existing } = await adminClient
      .from("profiles")
      .select("role, handle")
      .eq("id", targetId)
      .maybeSingle();

    let effectiveRole: string;
    if (existing?.role) {
      effectiveRole = existing.role;
    } else {
      if (!ALLOWED_ROLES.includes(role)) {
        return NextResponse.json({ error: "role must be talent or brand" }, { status: 400, headers: privateNoStoreHeaders() });
      }
      effectiveRole = role;
    }

    // ── 3. Validate categories BEFORE any write ──────────────────────────────
    // Moved ahead of the profiles/talent_profiles upserts below: validating
    // after them left a Talent-role `profiles` row on disk with no working
    // category (and, depending on timing, no `talent_profiles` row either)
    // whenever the submitted category wasn't a real active row — an invalid
    // category is now rejected with a clean 400 and zero rows written.
    const normalizedCategoryIds = Array.isArray(categoryIds)
      ? categoryIds.map((id) => normalizeCategoryId(String(id))).filter(Boolean)
      : effectiveRole === "talent" && talentProfileData?.category
        ? [normalizeCategoryId(String(talentProfileData.category))]
        : effectiveRole === "brand" && brandProfileData?.category_id
          ? [normalizeCategoryId(String(brandProfileData.category_id))]
          : [];

    if (normalizedCategoryIds.length) {
      const liveCategories = await fetchCategories(effectiveRole === "talent" ? "talent" : "brand", true);
      const validIds = new Set(liveCategories.map((c) => c.id));
      const invalid = normalizedCategoryIds.filter((id) => !validIds.has(id));

      if (invalid.length) {
        return NextResponse.json(
          { error: `invalid category: ${invalid.join(", ")}` },
          { status: 400, headers: privateNoStoreHeaders() },
        );
      }
    }

    // profiles columns: id, handle, full_name, avatar_url, city, bio, role, brand_category
    const { error: profileErr } = await adminClient
      .from("profiles")
      .upsert({ ...pick(profileData, PROFILE_FIELDS), id: targetId, role: effectiveRole });

    if (profileErr) {
      return NextResponse.json({ error: `profiles: ${profileErr.message}` }, { status: 500, headers: privateNoStoreHeaders() });
    }

    // Typed core row, written through the provider layer.
    // The `profiles` upsert above has already run, so trg_sync_profile_type has
    // populated profile_type_id and the service can resolve the provider.
    if (effectiveRole === "talent" && talentProfileData) {
      try {
        await profileService.updateCoreForUser(targetId, talentProfileData);
      } catch (e) {
        // The category passed the live `categories` taxonomy check above but
        // still failed the underlying DB write (e.g. talent_profiles.category
        // is a narrower Postgres enum than `categories` — a real, currently
        // live gap; see CLAUDE.md). Without this cleanup the profiles upsert
        // just above would be left standing with no talent_profiles row: the
        // exact partial-account state the category pre-check was meant to
        // prevent, just one step later. Only remove it for a brand-new
        // signup (`existing` was null) — never delete an existing account's
        // profiles row over a failed edit.
        if (!existing) {
          await adminClient.from("profiles").delete().eq("id", targetId);
        }
        const err = ProfileError.from(e);
        console.error("[profile] talent core upsert failed", err.code, err.internal);
        // Was: `talent_profiles: ${message}` — leaked the table name and the raw
        // PostgREST error. Documented leak, fixed here as part of the migration.
        return NextResponse.json(err.toBody(), { status: err.status, headers: privateNoStoreHeaders() });
      }
    }

    if (normalizedCategoryIds.length) {
      try {
        await setProfileCategories(targetId, normalizedCategoryIds);
      } catch (categoryErr) {
        return NextResponse.json(
          { error: `profile_categories: ${categoryErr instanceof Error ? categoryErr.message : "save failed"}` },
          { status: 500, headers: privateNoStoreHeaders() },
        );
      }
    }

    if (effectiveRole === "brand") {
      const categoryId = normalizedCategoryIds[0] ?? normalizeCategoryId(brandProfileData?.category_id);

      // The "seed `status` only on creation" rule moved into
      // BrandRepository.upsert — an approved brand must never be sent back to
      // pending by an ordinary profile save.
      try {
        await profileService.updateCoreForUser(targetId, {
          ...(brandProfileData ?? {}),
          category_id:  categoryId || null,
          company_name: profileData?.full_name ?? brandProfileData?.company_name ?? null,
        });
      } catch (e) {
        const err = ProfileError.from(e);
        console.error("[profile] brand core upsert failed", err.code, err.internal);
        // Was: `brand_profiles: ${message}`. Documented leak, fixed here.
        return NextResponse.json(err.toBody(), { status: err.status, headers: privateNoStoreHeaders() });
      }
    }

    if (effectiveRole === "talent") {
      invalidateTalent(profileData?.handle ?? existing?.handle ?? targetId);
    } else if (effectiveRole === "brand") {
      invalidateBrand(profileData?.handle ?? existing?.handle ?? targetId);
    }

    return NextResponse.json({ success: true }, { headers: privateNoStoreHeaders() });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: privateNoStoreHeaders() });
  }
}
