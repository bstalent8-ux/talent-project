export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/permissions";
import { fetchTalentActions, addTalentAction } from "@/features/admin/services/admin.service";
import { TALENT_ACTION_TYPES } from "@/features/admin/types";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return null;
  return user;
}

// GET — the action timeline for one talent (id = talent_profiles.id, same
// key TalentsTable/TalentEditorClient already use everywhere).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("talents", "read");
  if (denied) return denied;

  const { id } = await params;
  const actions = await fetchTalentActions(id);
  return NextResponse.json({ actions });
}

// POST — log one action (call/message/email/meeting/note) against a talent,
// with an optional follow-up date that fires an in-app reminder once due
// (see app/api/cron/talent-follow-ups). Logging an action is a "create" on
// the talents resource.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("talents", "create");
  if (denied) return denied;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json() as { actionType?: string; note?: string; followUpAt?: string | null };

  if (!body.actionType || !TALENT_ACTION_TYPES.includes(body.actionType as (typeof TALENT_ACTION_TYPES)[number])) {
    return NextResponse.json({ error: "invalid actionType" }, { status: 400 });
  }

  // talent_actions.talent_id references talent_profiles(id) — confirm it
  // exists so a stale/typo'd id fails with a clear 404 rather than a
  // foreign-key error surfacing as a generic 500.
  const { data: tp } = await adminClient.from("talent_profiles").select("id").eq("id", id).maybeSingle();
  if (!tp) return NextResponse.json({ error: "talent not found" }, { status: 404 });

  const action = await addTalentAction(id, {
    actionType:  body.actionType,
    note:        body.note ?? null,
    performedBy: admin.id,
    followUpAt:  body.followUpAt ?? null,
  });

  if (!action) return NextResponse.json({ error: "failed to log action" }, { status: 500 });
  return NextResponse.json({ action }, { status: 201 });
}
