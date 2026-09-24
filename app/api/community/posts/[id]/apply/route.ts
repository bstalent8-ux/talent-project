export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { notifyOfferApplicationReceived } from "@/lib/notifications/events";
import { canApplyOffer } from "@/lib/permissions";
import { privateNoStoreHeaders } from "@/lib/cache";
import { applyToOfferSchema } from "../../schema";

// POST /api/community/posts/[id]/apply — a brand applies to a talent's offer.
// Mirrors POST /api/jobs/[id]/apply with the applicant role swapped.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: postId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: privateNoStoreHeaders() });

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, role, account_status, brand_status, is_suspended, full_name")
    .eq("id", user.id)
    .single();
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500, headers: privateNoStoreHeaders() });

  const permission = canApplyOffer(profile);
  if (!permission.allowed) return NextResponse.json({ error: permission.reason === "role" ? "only brands can apply" : "forbidden" }, { status: 403, headers: privateNoStoreHeaders() });

  const { data: post, error: postError } = await adminClient
    .from("community_posts").select("id, post_type, status, user_id, title, expires_at").eq("id", postId).single();
  if (postError) {
    const status = postError.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: status === 404 ? "post not found" : postError.message }, { status, headers: privateNoStoreHeaders() });
  }
  if (post.post_type !== "offer") return NextResponse.json({ error: "not an offer" }, { status: 400, headers: privateNoStoreHeaders() });
  if (post.status !== "open") return NextResponse.json({ error: "offer is not open" }, { status: 400, headers: privateNoStoreHeaders() });
  if (post.expires_at && new Date(post.expires_at).getTime() <= Date.now()) {
    return NextResponse.json({ error: "offer has expired" }, { status: 400, headers: privateNoStoreHeaders() });
  }
  if (post.user_id === user.id) return NextResponse.json({ error: "cannot apply to your own offer" }, { status: 400, headers: privateNoStoreHeaders() });

  const { data: existing, error: existingError } = await adminClient
    .from("community_post_applications")
    .select("id, status, proposed_price, message")
    .eq("post_id", postId).eq("brand_id", user.id).maybeSingle();
  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500, headers: privateNoStoreHeaders() });
  if (existing) return NextResponse.json({ application: existing, already_applied: true }, { headers: privateNoStoreHeaders() });

  let parsed: z.infer<typeof applyToOfferSchema>;
  try {
    parsed = applyToOfferSchema.parse(await req.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", issues: err.issues }, { status: 400, headers: privateNoStoreHeaders() });
    }
    return NextResponse.json({ error: "invalid request body" }, { status: 400, headers: privateNoStoreHeaders() });
  }

  const { data: application, error } = await adminClient
    .from("community_post_applications")
    .insert({
      post_id: postId,
      brand_id: user.id,
      status: "pending",
      message: parsed.message,
      proposed_price: parsed.proposed_price ?? null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: privateNoStoreHeaders() });

  await notifyOfferApplicationReceived({
    postId,
    title:         post.title,
    applicationId: application.id,
    talentId:      post.user_id,
    brandId:       user.id,
    brandName:     profile?.full_name ?? null,
  });

  return NextResponse.json({ application }, { status: 201, headers: privateNoStoreHeaders() });
}

// GET — check if the current user already applied to this offer.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: postId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ applied: false }, { headers: privateNoStoreHeaders() });

  const { data, error } = await adminClient
    .from("community_post_applications")
    .select("id, status, proposed_price, message")
    .eq("post_id", postId).eq("brand_id", user.id).maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: privateNoStoreHeaders() });
  return NextResponse.json({ applied: !!data, application: data ?? null }, { headers: privateNoStoreHeaders() });
}
