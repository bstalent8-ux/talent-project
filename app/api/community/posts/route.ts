export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { canCreateOffer, canCreateStory } from "@/lib/permissions";
import { notifyOfferCreated } from "@/lib/notifications/events";
import { privateNoStoreHeaders, publicCacheHeaders } from "@/lib/cache";
import { createPostSchema } from "./schema";

const STORY_TTL_MS = 24 * 60 * 60 * 1000;

// GET /api/community/posts?type=offer|story&limit=50
// Public — offers/stories are as browsable as a community question. Stories
// are filtered to unexpired ones at read time; nothing deletes an expired
// row, it just stops being returned (see the migration's own comment).
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const type  = url.searchParams.get("type"); // "offer" | "story" | null (both)
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50) || 50, 100);

  let query = adminClient
    .from("community_posts")
    .select("id, user_id, post_type, title, content, price, category, media_url, status, expires_at, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (type === "offer" || type === "story") query = query.eq("post_type", type);

  const { data: posts, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: privateNoStoreHeaders() });

  // Read-time expiry: an expired story (or a past-due offer deadline) is
  // dropped here rather than filtered in SQL, so one query covers both
  // "story with an expiry" and "offer with none" without a NULL-handling
  // OR clause.
  const now = Date.now();
  const visible = (posts ?? []).filter((p) => !p.expires_at || new Date(p.expires_at).getTime() > now);

  const userIds = [...new Set(visible.map((p) => p.user_id))];
  const { data: profiles } = userIds.length
    ? await adminClient.from("profiles").select("id, full_name, handle, avatar_url, role, city").in("id", userIds)
    : { data: [] };
  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  const enriched = visible.map((p) => ({ ...p, author: profileMap[p.user_id] ?? null }));

  return NextResponse.json({ posts: enriched }, { headers: publicCacheHeaders() });
}

// POST /api/community/posts — a talent posts an offer, or anyone posts a story.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: privateNoStoreHeaders() });

  const { data: profile } = await adminClient
    .from("profiles")
    .select("id, role, account_status, is_suspended, full_name")
    .eq("id", user.id)
    .single();

  let body: z.infer<typeof createPostSchema>;
  try {
    body = createPostSchema.parse(await req.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", issues: err.issues }, { status: 400, headers: privateNoStoreHeaders() });
    }
    return NextResponse.json({ error: "invalid request body" }, { status: 400, headers: privateNoStoreHeaders() });
  }

  if (body.post_type === "offer") {
    const permission = canCreateOffer(profile);
    if (!permission.allowed) return NextResponse.json({ error: permission.reason === "role" ? "talents only" : "forbidden" }, { status: 403, headers: privateNoStoreHeaders() });

    const { data: post, error } = await adminClient
      .from("community_posts")
      .insert({
        user_id:    user.id,
        post_type:  "offer",
        title:      body.title,
        content:    body.content ?? null,
        category:   body.category ?? null,
        price:      body.price ?? null,
        media_url:  body.media_url ?? null,
        expires_at: body.expires_at ?? null,
        status:     "open",
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: privateNoStoreHeaders() });

    await notifyOfferCreated({ postId: post.id, title: post.title, talentId: user.id, talentName: profile?.full_name ?? null });

    return NextResponse.json({ post }, { status: 201, headers: privateNoStoreHeaders() });
  }

  // post_type === "story"
  const permission = canCreateStory(profile);
  if (!permission.allowed) return NextResponse.json({ error: "forbidden" }, { status: 403, headers: privateNoStoreHeaders() });

  const { data: post, error } = await adminClient
    .from("community_posts")
    .insert({
      user_id:    user.id,
      post_type:  "story",
      content:    body.content ?? null,
      media_url:  body.media_url ?? null,
      expires_at: new Date(Date.now() + STORY_TTL_MS).toISOString(),
      status:     "open",
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: privateNoStoreHeaders() });

  // Stories are ephemeral/low-stakes — no fan-out notification, same
  // posture as any other community post; the feed itself is the discovery
  // surface.
  return NextResponse.json({ post }, { status: 201, headers: privateNoStoreHeaders() });
}
