export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { privateNoStoreHeaders, publicCacheHeaders } from "@/lib/cache";

// Postgres "relation does not exist" — the migration hasn't been pasted in
// yet. Degrade to honest zeros/false instead of a 500, same convention as
// every other not-yet-applied migration in this app (see lib/fuzzy-search-db.ts).
const TABLE_MISSING = "42P01";

// GET /api/community/follow?target=<profileId>  — public counts + isFollowing
// GET /api/community/follow?mine=following        — the viewer's own follow list (auth required)
// Powers the feed's "Connected" tab: which authors to show.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const target = url.searchParams.get("target");
  const mine = url.searchParams.get("mine");

  if (mine === "following") {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: privateNoStoreHeaders() });

    const { data, error } = await adminClient.from("follows").select("followee_id").eq("follower_id", user.id);
    if (error?.code === TABLE_MISSING) return NextResponse.json({ followingIds: [] }, { headers: privateNoStoreHeaders() });
    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: privateNoStoreHeaders() });

    return NextResponse.json({ followingIds: (data ?? []).map((r) => r.followee_id) }, { headers: privateNoStoreHeaders() });
  }

  if (!target) return NextResponse.json({ error: "target required" }, { status: 400, headers: privateNoStoreHeaders() });

  const [followerCountRes, followingCountRes] = await Promise.all([
    adminClient.from("follows").select("id", { count: "exact", head: true }).eq("followee_id", target),
    adminClient.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", target),
  ]);

  if (followerCountRes.error?.code === TABLE_MISSING) {
    return NextResponse.json({ followerCount: 0, followingCount: 0, isFollowing: false }, { headers: publicCacheHeaders() });
  }

  let isFollowing = false;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user && user.id !== target) {
    const { data } = await adminClient
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("followee_id", target)
      .maybeSingle();
    isFollowing = !!data;
  }

  return NextResponse.json({
    followerCount: followerCountRes.count ?? 0,
    followingCount: followingCountRes.count ?? 0,
    isFollowing,
  }, { headers: privateNoStoreHeaders() });
}

const bodySchema = z.object({ followeeId: z.string().uuid() });

// POST /api/community/follow — follow a profile.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: privateNoStoreHeaders() });

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid request body" }, { status: 400, headers: privateNoStoreHeaders() });
  }
  if (body.followeeId === user.id) {
    return NextResponse.json({ error: "cannot follow yourself" }, { status: 400, headers: privateNoStoreHeaders() });
  }

  const { error } = await adminClient
    .from("follows")
    .upsert({ follower_id: user.id, followee_id: body.followeeId }, { onConflict: "follower_id,followee_id" });

  if (error) {
    if (error.code === TABLE_MISSING) return NextResponse.json({ error: "migration_required" }, { status: 409, headers: privateNoStoreHeaders() });
    return NextResponse.json({ error: error.message }, { status: 500, headers: privateNoStoreHeaders() });
  }

  return NextResponse.json({ ok: true }, { status: 201, headers: privateNoStoreHeaders() });
}

// DELETE /api/community/follow?followeeId=<id> — unfollow.
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: privateNoStoreHeaders() });

  const followeeId = new URL(req.url).searchParams.get("followeeId");
  if (!followeeId) return NextResponse.json({ error: "followeeId required" }, { status: 400, headers: privateNoStoreHeaders() });

  const { error } = await adminClient
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("followee_id", followeeId);

  if (error && error.code !== TABLE_MISSING) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: privateNoStoreHeaders() });
  }

  return NextResponse.json({ ok: true }, { headers: privateNoStoreHeaders() });
}
