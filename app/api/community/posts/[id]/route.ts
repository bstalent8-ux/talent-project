export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { privateNoStoreHeaders, publicCacheHeaders } from "@/lib/cache";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: post, error } = await adminClient
    .from("community_posts")
    .select("id, user_id, post_type, title, content, price, category, media_url, status, expires_at, created_at")
    .eq("id", id).single();

  if (error) {
    const status = error.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: status === 404 ? "post not found" : error.message }, { status, headers: privateNoStoreHeaders() });
  }
  if (post.expires_at && new Date(post.expires_at).getTime() <= Date.now()) {
    return NextResponse.json({ error: "post not found" }, { status: 404, headers: privateNoStoreHeaders() });
  }

  const { data: author } = await adminClient
    .from("profiles").select("id, full_name, handle, avatar_url, role, city").eq("id", post.user_id).maybeSingle();

  return NextResponse.json({ post: { ...post, author: author ?? null } }, { headers: publicCacheHeaders() });
}

// DELETE — owner takes their own post down early (a talent closing an offer,
// or removing a story before it expires on its own).
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: privateNoStoreHeaders() });

  const { data: post, error: fetchErr } = await adminClient
    .from("community_posts").select("id, user_id").eq("id", id).maybeSingle();
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500, headers: privateNoStoreHeaders() });
  if (!post) return NextResponse.json({ error: "post not found" }, { status: 404, headers: privateNoStoreHeaders() });
  if (post.user_id !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403, headers: privateNoStoreHeaders() });

  const { error } = await adminClient.from("community_posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: privateNoStoreHeaders() });

  return NextResponse.json({ success: true }, { headers: privateNoStoreHeaders() });
}
