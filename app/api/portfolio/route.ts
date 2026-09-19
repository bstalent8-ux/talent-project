export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { canPerformAction } from "@/lib/permissions";
import { invalidateTalent, privateNoStoreHeaders } from "@/lib/cache";
import { ProfileError, profileService } from "@/features/profiles";
import { notifyAdminMediaPending } from "@/lib/notifications/events";

/**
 * talent_profiles.id for the caller, through the provider layer.
 * Returns the row on success, or a ready-to-return NextResponse on failure —
 * preserving both existing outcomes: 500 on a lookup error, 404 "no talent
 * profile" when the caller has none.
 */
async function resolveTalentRef(userId: string): Promise<{ id: string } | NextResponse> {
  try {
    const ref = await profileService.resolveProviderRef(userId, "talent");
    if (!ref) {
      return NextResponse.json({ error: "no talent profile" }, { status: 404, headers: privateNoStoreHeaders() });
    }
    return { id: ref.providerProfileId };
  } catch (e) {
    const err = ProfileError.from(e);
    console.error("[portfolio] provider ref lookup failed", err.code, err.internal);
    return NextResponse.json(err.toBody(), { status: err.status, headers: privateNoStoreHeaders() });
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: privateNoStoreHeaders() });

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, role, handle, account_status, is_suspended")
    .eq("id", user.id)
    .single();
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500, headers: privateNoStoreHeaders() });
  if (!canPerformAction("upload_portfolio", profile).allowed) {
    return NextResponse.json({ error: "forbidden" }, { status: 403, headers: privateNoStoreHeaders() });
  }

  const { url, media_type, caption } = await req.json();

  // Get talent_profile id
  const resolved = await resolveTalentRef(user.id);
  if (resolved instanceof NextResponse) return resolved;
  const tp = resolved;

  // Every upload waits for admin review before it can show on the public profile,
  // whatever the state of the profile itself. is_approved is the public switch; the
  // review_status column (migration 20260919_media_moderation.sql) records the trail.
  const base = { talent_id: tp.id, url, media_type: media_type ?? "photo", caption: caption ?? null, sort_order: 0, is_approved: false };
  let { data, error } = await adminClient.from("portfolio_items").insert({ ...base, review_status: "pending" }).select().single();
  if (error && /review_status/.test(error.message)) {
    // Migration not applied yet — is_approved:false alone already keeps the row private.
    ({ data, error } = await adminClient.from("portfolio_items").insert(base).select().single());
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: privateNoStoreHeaders() });
  invalidateTalent(profile?.handle ?? user.id);

  // Tell the admins there is something to review. Never blocks the upload.
  const { data: who } = await adminClient.from("profiles").select("full_name").eq("id", user.id).single();
  notifyAdminMediaPending({ submitterId: user.id, submitterName: who?.full_name ?? profile?.handle ?? "—" }).catch(() => null);

  return NextResponse.json({ item: data }, { headers: privateNoStoreHeaders() });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: privateNoStoreHeaders() });

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, role, handle, account_status, is_suspended")
    .eq("id", user.id)
    .single();
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500, headers: privateNoStoreHeaders() });
  if (!canPerformAction("upload_portfolio", profile).allowed) {
    return NextResponse.json({ error: "forbidden" }, { status: 403, headers: privateNoStoreHeaders() });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400, headers: privateNoStoreHeaders() });

  // Scope the delete to the caller's own talent profile — without this any
  // signed-in user can delete any talent's portfolio item by id.
  const resolved = await resolveTalentRef(user.id);
  if (resolved instanceof NextResponse) return resolved;
  const tp = resolved;

  const { error } = await adminClient
    .from("portfolio_items")
    .delete()
    .eq("id", id)
    .eq("talent_id", tp.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: privateNoStoreHeaders() });
  invalidateTalent(profile?.handle ?? user.id);
  return NextResponse.json({ success: true }, { headers: privateNoStoreHeaders() });
}
