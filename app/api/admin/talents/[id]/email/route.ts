export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/permissions";
import { revalidatePath } from "next/cache";
import { addTalentAction } from "@/features/admin/services/admin.service";
import { privateNoStoreHeaders } from "@/lib/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return null;
  return user;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// PATCH — admin override for a talent's login email (id = talent_profiles.id,
// same key every other route under /admin/talents/[id] uses). Unlike the
// talent's own /settings flow (supabase.auth.updateUser({email}), which sends
// a confirm link to the NEW address), this uses the service-role admin API
// with email_confirm: true — the change applies immediately, no confirmation
// step, because the point of this route is unblocking a talent who can't
// complete that flow themselves (locked out of the old inbox, typo'd the
// address at signup, etc.). See TalentEditorClient's read-only "Registration
// info" comment for why this was intentionally admin-only before now.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("talents", "update");
  if (denied) return denied;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403, headers: privateNoStoreHeaders() });

  const { id } = await params;
  const body = await req.json().catch(() => null) as { email?: string } | null;
  const newEmail = body?.email?.trim().toLowerCase();

  if (!newEmail || !EMAIL_RE.test(newEmail)) {
    return NextResponse.json({ error: "invalid email" }, { status: 400, headers: privateNoStoreHeaders() });
  }

  const { data: tp } = await adminClient.from("talent_profiles").select("user_id").eq("id", id).maybeSingle();
  if (!tp?.user_id) return NextResponse.json({ error: "talent not found" }, { status: 404, headers: privateNoStoreHeaders() });

  const { data: before } = await adminClient.auth.admin.getUserById(tp.user_id);
  const oldEmail = before?.user?.email ?? null;

  if (oldEmail?.toLowerCase() === newEmail) {
    return NextResponse.json({ error: "same email" }, { status: 400, headers: privateNoStoreHeaders() });
  }

  const { error } = await adminClient.auth.admin.updateUserById(tp.user_id, {
    email: newEmail,
    email_confirm: true,
  });

  if (error) {
    // Supabase surfaces "already registered" as a generic message — map it
    // to a stable code the admin UI can show a clear "already in use" string
    // for, instead of the raw Supabase error text.
    const inUse = /already.*registered|already.*exists|duplicate/i.test(error.message ?? "");
    return NextResponse.json(
      { error: inUse ? "email_in_use" : error.message },
      { status: inUse ? 409 : 500, headers: privateNoStoreHeaders() },
    );
  }

  // Best-effort audit trail — never fails the email change itself.
  await addTalentAction(id, {
    actionType:  "note",
    note:        `Admin changed login email: ${oldEmail ?? "(none)"} → ${newEmail}`,
    performedBy: admin.id,
    followUpAt:  null,
  }).catch((e) => console.error("[admin/talents/email] action log failed", e));

  revalidatePath(`/admin/talents/${id}`);

  return NextResponse.json({ ok: true, email: newEmail }, { headers: privateNoStoreHeaders() });
}
