export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/permissions";
import { getAdminUser } from "@/lib/auth/require-admin";
import { invalidateTalent, privateNoStoreHeaders } from "@/lib/cache";

// Sets one talent's social_links.gender (the Explore Male/Female filter key)
// from /admin/talents/gender. Merges into the existing social_links — only the
// gender key changes. `gender: null` clears it.
//
//   PATCH { profileId: uuid, gender: "male" | "female" | null }

const schema = z.object({
  profileId: z.string().uuid(),
  gender:    z.enum(["male", "female"]).nullable(),
}).strict();

export async function PATCH(req: NextRequest) {
  const denied = await requirePermission("talents", "update");
  if (denied) return denied;
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403, headers: privateNoStoreHeaders() });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400, headers: privateNoStoreHeaders() });
  const { profileId, gender } = parsed.data;

  const [{ data: tp, error }, { data: profile }] = await Promise.all([
    adminClient.from("talent_profiles").select("social_links").eq("user_id", profileId).limit(1).maybeSingle(),
    adminClient.from("profiles").select("handle").eq("id", profileId).maybeSingle(),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: privateNoStoreHeaders() });
  if (!tp) return NextResponse.json({ error: "not found" }, { status: 404, headers: privateNoStoreHeaders() });

  const socialLinks = { ...((tp.social_links ?? {}) as Record<string, unknown>) };
  if (gender) socialLinks.gender = gender; else delete socialLinks.gender;

  const { error: updErr } = await adminClient
    .from("talent_profiles")
    .update({ social_links: socialLinks })
    .eq("user_id", profileId);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500, headers: privateNoStoreHeaders() });

  invalidateTalent(profile?.handle ?? profileId);
  return NextResponse.json({ ok: true, gender }, { headers: privateNoStoreHeaders() });
}
