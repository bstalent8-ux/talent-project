import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return null;
  return user;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json() as { action: string; reason?: string };

  const updates: Record<string, unknown> = {};

  switch (body.action) {
    case "approve":
      updates.status = "approved";
      updates.approved_at = new Date().toISOString();
      updates.approved_by = admin.id;
      updates.rejection_reason = null;
      break;
    case "reject":
      updates.status = "rejected";
      updates.rejection_reason = body.reason ?? null;
      updates.approved_at = null;
      updates.approved_by = null;
      break;
    case "suspend":
      updates.status = "suspended";
      break;
    case "restore":
      updates.status = "approved";
      break;
    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { error } = await adminClient
    .from("talent_profiles")
    .update(updates)
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath("/admin/talents");
  revalidatePath("/explore");

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const { error } = await adminClient
    .from("talent_profiles")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath("/admin/talents");
  revalidatePath("/explore");

  return NextResponse.json({ ok: true });
}
