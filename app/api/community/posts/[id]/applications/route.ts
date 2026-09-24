export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { privateNoStoreHeaders } from "@/lib/cache";

// GET /api/community/posts/[id]/applications — the talent who owns this
// offer reviews everyone who applied. Mirrors GET /api/jobs/[id]/applications.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: postId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: privateNoStoreHeaders() });

  const { data: post, error: postError } = await adminClient
    .from("community_posts").select("id, user_id, post_type").eq("id", postId).single();
  if (postError) {
    const status = postError.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: status === 404 ? "post not found" : postError.message }, { status, headers: privateNoStoreHeaders() });
  }
  if (post.user_id !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403, headers: privateNoStoreHeaders() });

  const { data: applications, error } = await adminClient
    .from("community_post_applications")
    .select("id, brand_id, status, message, proposed_price, reject_reason, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: privateNoStoreHeaders() });

  const brandIds = [...new Set((applications ?? []).map((a) => a.brand_id))];
  const { data: profiles } = brandIds.length
    ? await adminClient.from("profiles").select("id, full_name, handle, avatar_url, city").in("id", brandIds)
    : { data: [] };
  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  const enriched = (applications ?? []).map((a) => ({ ...a, brand: profileMap[a.brand_id] ?? null }));

  return NextResponse.json({ applications: enriched }, { headers: privateNoStoreHeaders() });
}
