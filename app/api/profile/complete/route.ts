export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { canPerformAction } from "@/lib/permissions";
import { invalidateTalent, privateNoStoreHeaders } from "@/lib/cache";

async function saveTalentProfileSection(
  userId: string,
  existing: { id?: string } | null,
  payload: Record<string, unknown>,
) {
  const result = existing
    ? await adminClient.from("talent_profiles").update(payload).eq("user_id", userId)
    : await adminClient.from("talent_profiles").insert({ user_id: userId, ...payload });

  return result.error;
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

    // ── talent_profiles table ─────────────────────────────
    // Get existing row first
    const { data: existing, error: existingError } = await adminClient
      .from("talent_profiles")
      .select("id, social_links")
      .eq("user_id", uid)
      .maybeSingle();
    if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500, headers: privateNoStoreHeaders() });

    if (section === "categories") {
      const error = await saveTalentProfileSection(uid, existing, { category: data.category });
      if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: privateNoStoreHeaders() });
    } else if (section === "social") {
      // Only keep non-empty values, merge with existing
      const incoming = Object.fromEntries(
        Object.entries(data as Record<string, string>).filter(([, v]) => v && v.trim().length > 0),
      );
      const merged = { ...(existing?.social_links ?? {}), ...incoming };
      const error = await saveTalentProfileSection(uid, existing, { social_links: merged });
      if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: privateNoStoreHeaders() });
    } else if (section === "availability") {
      const error = await saveTalentProfileSection(uid, existing, { availability: data.availability });
      if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: privateNoStoreHeaders() });
    } else if (section === "physical") {
      const allowed = ["height","weight","hair_color","shoe_size","age","languages","dialect"];
      const incoming = Object.fromEntries(
        Object.entries(data as Record<string,string>).filter(([k,v]) => allowed.includes(k) && v && String(v).trim().length > 0),
      );
      const merged = { ...(existing?.social_links ?? {}), ...incoming };
      const error = await saveTalentProfileSection(uid, existing, { social_links: merged });
      if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: privateNoStoreHeaders() });
    } else if (section === "packages") {
      const error = await saveTalentProfileSection(uid, existing, { packages: data.packages });
      if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: privateNoStoreHeaders() });
    } else if (section === "usage_addons") {
      const { data: existingRow, error: existingRowError } = await adminClient
        .from("talent_profiles")
        .select("id, social_links")
        .eq("user_id", uid)
        .maybeSingle();
      if (existingRowError) return NextResponse.json({ error: existingRowError.message }, { status: 500, headers: privateNoStoreHeaders() });
      const merged = { ...(existingRow?.social_links ?? {}), usage_addons: data.usage_addons };
      const error = await saveTalentProfileSection(uid, existingRow, { social_links: merged });
      if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: privateNoStoreHeaders() });
    } else {
      return NextResponse.json({ error: "unknown section" }, { status: 400, headers: privateNoStoreHeaders() });
    }

    invalidateTalent(profile?.handle ?? uid);
    return NextResponse.json({ success: true }, { headers: privateNoStoreHeaders() });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: privateNoStoreHeaders() });
  }
}
