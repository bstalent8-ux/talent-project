export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { canPerformAction } from "@/lib/permissions";
import { invalidateTalent, privateNoStoreHeaders } from "@/lib/cache";
import { ProfileError, profileService } from "@/features/profiles";
import { TALENT_PHYSICAL_KEYS, TALENT_SOCIAL_KEYS, isSafePresenceValue } from "@/lib/profile-fields";

/**
 * Writes one section's fields to the typed core row through the provider layer.
 *
 * Replaces the former insert-or-update branch: the provider upserts on
 * `user_id`, which produces the same row either way.
 *
 * Returns an error-shaped object so the existing call sites keep their
 * `if (error) return 500` structure unchanged.
 */
async function saveTalentProfileSection(
  userId: string,
  payload: Record<string, unknown>,
): Promise<{ message: string; status: number } | null> {
  try {
    await profileService.updateCoreForUser(userId, payload);
    return null;
  } catch (e) {
    const err = ProfileError.from(e);
    console.error("[profile/complete] core write failed", err.code, err.internal);
    return { message: err.publicMessage, status: err.status };
  }
}

// PATCH /api/profile/complete
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: privateNoStoreHeaders() });

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("id, role, handle, account_status, is_suspended")
      .eq("id", user.id)
      .single();
    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500, headers: privateNoStoreHeaders() });
    }
    if (!canPerformAction("access_profile_management", profile).allowed) {
      return NextResponse.json({ error: "forbidden" }, { status: 403, headers: privateNoStoreHeaders() });
    }

    const { section, data } = await req.json();
    if (!section || !data) return NextResponse.json({ error: "section and data required" }, { status: 400, headers: privateNoStoreHeaders() });

    const uid = user.id;

    // ── profiles table ────────────────────────────────────
    if (["avatar", "personal", "bio"].includes(section)) {
      const allowed: Record<string, string[]> = {
        avatar:   ["avatar_url"],
        personal: ["full_name", "city"],
        bio:      ["bio"],
      };
      const update = Object.fromEntries(
        Object.entries(data).filter(([k]) => allowed[section].includes(k)),
      );
      const { error } = await adminClient.from("profiles").update(update).eq("id", uid);
      if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: privateNoStoreHeaders() });
      invalidateTalent(profile?.handle ?? uid);
      return NextResponse.json({ success: true }, { headers: privateNoStoreHeaders() });
    }

    // ── typed core row ────────────────────────────────────
    // Read the existing row first: every social_links section MERGES into it,
    // so a partial write must never clobber the other keys. That merge is
    // pre-existing controller logic and stays exactly where it was.
    let existingSocialLinks: Record<string, unknown> = {};
    // A talent account can reach this route with no talent_profiles row yet
    // (a partial signup — see CLAUDE.md's self-healing profiles note, and
    // /profile/me/complete's own role-not-presence gate). The provider
    // upserts on user_id, so any section's save becomes that row's first
    // INSERT — and talent_profiles.category is NOT NULL. Every write below
    // must therefore carry a category, not just the "categories" section,
    // or the very first save (e.g. Measurements, before the category step)
    // fails the NOT NULL constraint outright.
    let existingCategory: string | null = null;
    try {
      const loaded = await profileService.loadCoreRow(uid);
      if (loaded?.typeSlug === "talent") {
        const core = loaded.core as Record<string, unknown>;
        existingSocialLinks = (core.social_links as Record<string, unknown>) ?? {};
        existingCategory = (core.category as string) ?? null;
      }
    } catch (e) {
      const err = ProfileError.from(e);
      console.error("[profile/complete] core read failed", err.code, err.internal);
      return NextResponse.json(err.toBody(), { status: err.status, headers: privateNoStoreHeaders() });
    }

    let saveError: { message: string; status: number } | null = null;
    // Only backfills when the row doesn't have a category yet — never
    // downgrades a real, already-chosen category.
    const categoryFallback = { category: existingCategory ?? "ugc" };

    if (section === "categories") {
      saveError = await saveTalentProfileSection(uid, { category: data.category });
    } else if (section === "social") {
      // Allowlisted keys only (TALENT_SOCIAL_KEYS — the same 8 platforms the
      // wizard and the public renderer agree on), non-empty, and no
      // dangerous scheme (javascript:, data:, ...) — see isSafePresenceValue.
      const incoming = Object.fromEntries(
        Object.entries(data as Record<string, string>).filter(
          ([k, v]) => TALENT_SOCIAL_KEYS.includes(k as any) && typeof v === "string" && isSafePresenceValue(v),
        ),
      );
      saveError = await saveTalentProfileSection(uid, { ...categoryFallback, social_links: { ...existingSocialLinks, ...incoming } });
    } else if (section === "availability") {
      saveError = await saveTalentProfileSection(uid, { ...categoryFallback, availability: data.availability });
    } else if (section === "physical") {
      const incoming = Object.fromEntries(
        Object.entries(data as Record<string,string>).filter(([k,v]) => TALENT_PHYSICAL_KEYS.includes(k as any) && v && String(v).trim().length > 0),
      );
      saveError = await saveTalentProfileSection(uid, { ...categoryFallback, social_links: { ...existingSocialLinks, ...incoming } });
    } else if (section === "packages") {
      saveError = await saveTalentProfileSection(uid, { ...categoryFallback, packages: data.packages });
    } else if (section === "usage_addons") {
      // Previously re-read the row here; the single read above serves both,
      // and the merge result is identical.
      saveError = await saveTalentProfileSection(uid, {
        ...categoryFallback,
        social_links: { ...existingSocialLinks, usage_addons: data.usage_addons },
      });
    } else {
      return NextResponse.json({ error: "unknown section" }, { status: 400, headers: privateNoStoreHeaders() });
    }

    if (saveError) {
      return NextResponse.json({ error: saveError.message }, { status: saveError.status, headers: privateNoStoreHeaders() });
    }

    invalidateTalent(profile?.handle ?? uid);
    return NextResponse.json({ success: true }, { headers: privateNoStoreHeaders() });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: privateNoStoreHeaders() });
  }
}
