import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await adminClient.from("profiles").select("role").eq("id", user.id).single();
  return data?.role === "admin" ? user : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { profileId } = await params;
  const { action, reason } = await req.json() as { action: string; reason?: string };

  const updates: Record<string, unknown> = {};

  switch (action) {
    case "block":
      updates.account_status = "blocked";
      updates.blocked_at = new Date().toISOString();
      updates.blocked_by = admin.id;
      updates.block_reason = reason ?? null;
      break;
    case "suspend":
      updates.account_status = "suspended";
      updates.blocked_at = new Date().toISOString();
      updates.blocked_by = admin.id;
      updates.block_reason = reason ?? null;
      break;
    case "unblock":
      updates.account_status = "active";
      updates.blocked_at = null;
      updates.blocked_by = null;
      updates.block_reason = null;
      break;
    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { error } = await adminClient
    .from("profiles")
    .update(updates)
    .eq("id", profileId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath("/admin/talents");
  revalidatePath("/admin/brands");

  return NextResponse.json({ ok: true });
}
