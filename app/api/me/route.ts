export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { privateNoStoreHeaders } from "@/lib/cache";
import { profileService } from "@/features/profiles";

// The exact `talentProfile` keys this endpoint has always returned. Projected
// explicitly so the payload stays byte-identical now that the core row is
// loaded through the provider, which selects a wider column set.
// Consumers: app/(main)/profile/me/page.tsx, components/Navbar.tsx.
const TALENT_PROFILE_KEYS = [
  "id", "category", "specialties", "availability", "availability_schedule", "bio", "avg_rating",
  "total_reviews", "total_bookings", "profile_views", "social_links",
  "packages", "is_featured", "status",
] as const;

// Ditto for portfolio items — no is_approved key, and no is_approved filter.
const PORTFOLIO_KEYS = ["id", "url", "media_type", "caption", "sort_order"] as const;

function project<T extends Record<string, unknown>>(row: T | null, keys: readonly string[]) {
  if (!row) return null;
  const out: Record<string, unknown> = {};
  for (const key of keys) out[key] = row[key] ?? null;
  return out;
}

export async function GET(req: NextRequest) {
  try {
    // Validate the user's session using the server client
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: privateNoStoreHeaders() });

    // Use admin client to bypass RLS
    let { data: profile } = await adminClient
      .from("profiles")
      .select("id, full_name, handle, city, avatar_url, bio, role, created_at")
      .eq("id", user.id)
      .maybeSingle();

    // Auto-create profile if missing
    if (!profile) {
      const meta = user.user_metadata ?? {};
      const emailHandle = user.email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9-]/g, "-") ?? user.id.slice(0, 8);
      // user_metadata is set client-side at signUp, so it is untrusted —
      // never let it seed a privileged role here.
      const safeRole = meta.role === "brand" ? "brand" : "talent";
      await adminClient.from("profiles").insert({
        id:        user.id,
        role:      safeRole,
        full_name: meta.full_name ?? emailHandle,
        handle:    emailHandle,
      });
      const { data: retried } = await adminClient
        .from("profiles")
        .select("id, full_name, handle, city, avatar_url, bio, role, created_at")
        .eq("id", user.id)
        .maybeSingle();
      profile = retried;
    }

    if (!profile) return NextResponse.json({ error: "profile not found" }, { status: 404, headers: privateNoStoreHeaders() });

    // Talent profile — loaded through the provider layer.
    // Guarded on typeSlug: a brand user has a brand_profiles row, and this
    // endpoint has always returned null for them under the `talentProfile` key.
    const loaded = await profileService.loadCoreRow(user.id);
    const talentCore = loaded?.typeSlug === "talent"
      ? (loaded.core as Record<string, unknown>)
      : null;
    const talentProfile = project(talentCore, TALENT_PROFILE_KEYS);

    // Portfolio items — portfolio_items is not a Class B table; left in place.
    let portfolioItems: any[] = [];
    if (talentCore?.id) {
      const { data: items } = await adminClient
        .from("portfolio_items")
        .select("id, url, media_type, caption, sort_order")
        .eq("talent_id", talentCore.id as string)
        .order("sort_order", { ascending: true });
      portfolioItems = (items ?? []).map((i) => project(i, PORTFOLIO_KEYS));
    }

    return NextResponse.json({ profile, talentProfile, portfolioItems }, { headers: privateNoStoreHeaders() });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: privateNoStoreHeaders() });
  }
}
