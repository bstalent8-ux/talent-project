export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/profile/complete
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { section, data } = await req.json();
    if (!section || !data) return NextResponse.json({ error: "section and data required" }, { status: 400 });

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
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    // ── talent_profiles table ─────────────────────────────
    // Get existing row first
    const { data: existing } = await adminClient
      .from("talent_profiles")
      .select("id, social_links")
      .eq("user_id", uid)
      .maybeSingle();

    if (section === "categories") {
      if (existing) {
        await adminClient.from("talent_profiles")
          .update({ category: data.category })
          .eq("user_id", uid);
      } else {
        await adminClient.from("talent_profiles")
          .insert({ user_id: uid, category: data.category });
      }
    } else if (section === "social") {
      // Only keep non-empty values, merge with existing
      const incoming = Object.fromEntries(
        Object.entries(data as Record<string, string>).filter(([, v]) => v && v.trim().length > 0),
      );
      const merged = { ...(existing?.social_links ?? {}), ...incoming };
      if (existing) {
        await adminClient.from("talent_profiles")
          .update({ social_links: merged })
          .eq("user_id", uid);
      } else {
        await adminClient.from("talent_profiles")
          .insert({ user_id: uid, social_links: merged });
      }
    } else if (section === "availability") {
      if (existing) {
        await adminClient.from("talent_profiles")
          .update({ availability: data.availability })
          .eq("user_id", uid);
      } else {
        await adminClient.from("talent_profiles")
          .insert({ user_id: uid, availability: data.availability });
      }
    } else if (section === "physical") {
      const allowed = ["height","weight","hair_color","shoe_size","age","languages","dialect"];
      const incoming = Object.fromEntries(
        Object.entries(data as Record<string,string>).filter(([k,v]) => allowed.includes(k) && v && String(v).trim().length > 0),
      );
      const merged = { ...(existing?.social_links ?? {}), ...incoming };
      if (existing) {
        await adminClient.from("talent_profiles").update({ social_links: merged }).eq("user_id", uid);
      } else {
        await adminClient.from("talent_profiles").insert({ user_id: uid, social_links: merged });
      }
    } else if (section === "packages") {
      if (existing) {
        await adminClient.from("talent_profiles")
          .update({ packages: data.packages })
          .eq("user_id", uid);
      } else {
        await adminClient.from("talent_profiles")
          .insert({ user_id: uid, packages: data.packages });
      }
    } else if (section === "usage_addons") {
      const { data: existingRow } = await adminClient
        .from("talent_profiles")
        .select("id, social_links")
        .eq("user_id", uid)
        .maybeSingle();
      const merged = { ...(existingRow?.social_links ?? {}), usage_addons: data.usage_addons };
      if (existingRow) {
        await adminClient.from("talent_profiles")
          .update({ social_links: merged })
          .eq("user_id", uid);
      } else {
        await adminClient.from("talent_profiles")
          .insert({ user_id: uid, social_links: merged });
      }
    } else {
      return NextResponse.json({ error: "unknown section" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
