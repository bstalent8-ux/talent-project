export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { revalidatePath, revalidateTag } from "next/cache";
import { createNotification } from "@/lib/notifications/events";
import { withI18n } from "@/lib/notifications/templates";
import { CACHE_TAGS } from "@/lib/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await adminClient.from("profiles").select("role").eq("id", user.id).single();
  return data?.role === "admin" ? user : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { action, reason } = await req.json() as { action: "approve" | "reject"; reason?: string };

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { data: row, error: fetchErr } = await adminClient
    .from("landing_brand_moments")
    .select("id, submitter_id")
    .eq("id", id)
    .single();

  if (fetchErr || !row) {
    return NextResponse.json({ error: "Brand moment not found" }, { status: 404 });
  }

  const { error: updateErr } = await adminClient
    .from("landing_brand_moments")
    .update({
      status:           action === "approve" ? "approved" : "rejected",
      reviewed_at:      new Date().toISOString(),
      reviewed_by:      admin.id,
      rejection_reason: action === "reject" ? (reason ?? null) : null,
    })
    .eq("id", id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  await createNotification({
    recipientId: row.submitter_id,
    type:        "GENERAL",
    senderId:    admin.id,
    actionUrl:   "/home",
    ...withI18n(
      action === "approve"
        ? { title: { ar: "تمت الموافقة على صورتك 🎉", en: "Your brand moment was approved 🎉" },
            message: { ar: "الصورة بتظهر دلوقتي في الصفحة الرئيسية.", en: "Your campaign photo is now live on the home page." } }
        : { title: { ar: "لم تتم الموافقة على صورتك", en: "Your brand moment wasn't approved" },
            message: { ar: reason?.trim() || "راجع فريق Talents الصورة ولم يوافق عليها.", en: reason?.trim() || "The Talents team reviewed your photo and didn't approve it." } },
    ),
  });

  revalidatePath("/admin/brand-moments");
  revalidatePath("/home");
  revalidateTag(CACHE_TAGS.home.public);
  return NextResponse.json({ ok: true });
}
