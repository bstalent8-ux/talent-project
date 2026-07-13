export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    // Validate the user's session using the server client
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

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
      await adminClient.from("profiles").insert({
        id:        user.id,
        role:      meta.role ?? "talent",
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

    if (!profile) return NextResponse.json({ error: "profile not found" }, { status: 404 });

    // Talent profile
    const { data: talentProfile } = await adminClient
      .from("talent_profiles")
      .select("id, category, specialties, availability, bio, avg_rating, total_reviews, total_bookings, profile_views, social_links, packages, is_featured")
      .eq("user_id", user.id)
      .maybeSingle();

    // Portfolio items
    let portfolioItems: any[] = [];
    if (talentProfile?.id) {
      const { data: items } = await adminClient
        .from("portfolio_items")
        .select("id, url, media_type, caption, sort_order")
        .eq("talent_id", talentProfile.id)
        .order("sort_order", { ascending: true });
      portfolioItems = items ?? [];
    }

    return NextResponse.json({ profile, talentProfile: talentProfile ?? null, portfolioItems });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}