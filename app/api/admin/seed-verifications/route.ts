import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";

export async function GET() {
  const log: string[] = [];

  // 1. Delete old verification requests to start fresh
  await adminClient.from("talent_verifications").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // 2. Get first 10 existing talents from DB
  const { data: talents, error: tErr } = await adminClient
    .from("profiles")
    .select("id, full_name, handle")
    .eq("role", "talent")
    .order("created_at", { ascending: false })
    .limit(10);

  if (tErr || !talents?.length) {
    return NextResponse.json({ error: tErr?.message ?? "No talents found" }, { status: 400 });
  }

  // 3. Insert one verification request per talent with varied statuses
  const statuses = ["pending", "pending", "pending", "pending", "pending", "pending", "approved", "approved", "rejected", "rejected"];
  const socialLinks = [
    "https://instagram.com/talent1", "https://tiktok.com/@talent2",
    "https://instagram.com/talent3", "https://youtube.com/talent4",
    "https://instagram.com/talent5", "https://tiktok.com/@talent6",
    "https://instagram.com/talent7", "https://instagram.com/talent8",
    "https://tiktok.com/@talent9",  "https://instagram.com/talent10",
  ];

  for (let i = 0; i < talents.length; i++) {
    const talent = talents[i];
    const status = statuses[i] ?? "pending";

    const { error } = await adminClient.from("talent_verifications").insert({
      talent_id:        talent.id,
      status,
      id_document_url:  "https://placehold.co/400x250/1e293b/ffffff?text=ID+Document",
      selfie_url:       i % 2 === 0 ? "https://placehold.co/300x300/1e293b/ffffff?text=Selfie" : null,
      social_proof:     socialLinks[i],
      rejection_reason: status === "rejected" ? "الوثيقة غير واضحة — يرجى إعادة الرفع" : null,
    });

    if (error) {
      log.push(`✗ ${talent.handle}: ${error.message}`);
    } else {
      log.push(`✓ ${talent.handle} (${status})`);
    }
  }

  // 4. Mark verified talents
  const approvedHandles = talents.filter((_, i) => statuses[i] === "approved").map(t => t.id);
  if (approvedHandles.length) {
    await adminClient.from("profiles").update({ is_verified: true }).in("id", approvedHandles);
  }

  return NextResponse.json({
    success: true,
    count:   log.filter(l => l.startsWith("✓")).length,
    log,
  });
}
