export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, role, profileData, talentProfileData } = body;

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

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
