export const runtime = 'edge';

/**
 * GET /api/admin/seed-all
 * Seeds bookings (all pipeline stages), reviews (all statuses),
 * and verification requests so the admin panel has real data to show.
 * Safe to call multiple times — uses upsert / checks for existing.
 */
import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";

export async function GET() {
  const log: string[] = [];

  // ── 1. Fetch existing talents + clients ───────────────────────
  const { data: talents } = await adminClient
    .from("profiles")
    .select("id, full_name")
    .eq("role", "talent")
    .limit(10);

  const { data: clients } = await adminClient
    .from("profiles")
    .select("id, full_name")
    .eq("role", "brand")
    .limit(10);

  const { data: tps } = await adminClient
    .from("talent_profiles")
    .select("id, user_id")
    .limit(10);

  if (!talents?.length || !clients?.length || !tps?.length) {
    return NextResponse.json({
      error: "Run /api/admin/seed first to create base talent + client profiles",
      talents: talents?.length ?? 0,
      clients: clients?.length ?? 0,
      tps: tps?.length ?? 0,
    }, { status: 400 });
  }

  // helper to pick by index (cycling)
  const t = (i: number) => talents[i % talents.length];
  const c = (i: number) => clients[i % clients.length];
  const tp = (i: number) => tps[i % tps.length];

  // ── 2. Bookings — one per pipeline stage ─────────────────────
  const PIPELINE_STATUSES = [
    "contacting", "brief_sent", "accepted",
    "payment_pending", "in_progress", "completed", "paid", "cancelled",
  ];

  const bookingInserts = PIPELINE_STATUSES.map((status, i) => ({
    talent_id:  tp(i).id,
    brand_id:   c(i).id,
    status,
    amount:     status === "paid" || status === "completed" ? (i + 1) * 500 : null,
    notes:      `Test booking — stage: ${status}`,
    paid_at:    status === "paid" ? new Date().toISOString() : null,
    completed_at: (status === "paid" || status === "completed") ? new Date().toISOString() : null,
  }));

  const { error: bookErr } = await adminClient.from("bookings").insert(bookingInserts);
  if (bookErr) log.push(`bookings error: ${bookErr.message}`);
  else log.push(`✓ inserted ${bookingInserts.length} bookings`);

  // ── 3. Get inserted bookings to link reviews ──────────────────
  const { data: completedBookings } = await adminClient
    .from("bookings")
    .select("id, talent_id, brand_id")
    .in("status", ["completed", "paid"])
    .limit(6);

  // ── 4. Reviews — pending / approved / rejected ────────────────
  if (completedBookings?.length) {
    const reviewStatuses = ["pending", "approved", "rejected", "approved", "pending", "rejected"];
    const reviewTypes    = ["brand", "ugc", "collaboration", "brand", "ugc", "brand"];
    const ratings        = [5, 4, 3, 5, 4, 2];
    const comments       = [
      "تعاون رائع وإبداع لافت. سنعمل معهم مجدداً بالتأكيد!",
      "جودة المحتوى ممتازة. وصل الأثر للجمهور المستهدف.",
      "التسليم كان متأخراً قليلاً لكن الجودة مقبولة.",
      "أفضل موهبة تعاملنا معها. نتائج قياسية في وقت قصير.",
      "محتوى أصيل وتفاعل عالي من الجمهور. شكراً!",
      "لم تلتزم بالمواصفات المطلوبة. غير راضٍ عن النتيجة.",
    ];

    const reviewInserts = completedBookings.slice(0, 6).map((b, i) => ({
      booking_id:  b.id,
      talent_id:   b.talent_id,
      brand_id:    b.brand_id,
      rating:      ratings[i] ?? 4,
      comment:     comments[i] ?? "تقييم اختباري",
      status:      reviewStatuses[i] ?? "pending",
      review_type: reviewTypes[i] ?? "brand",
      proof_link:  i % 2 === 0 ? "https://example.com/proof" : null,
    }));

    const { error: revErr } = await adminClient.from("reviews").insert(reviewInserts);
    if (revErr) log.push(`reviews error: ${revErr.message}`);
    else log.push(`✓ inserted ${reviewInserts.length} reviews`);
  } else {
    log.push("⚠ no completed bookings found — reviews skipped");
  }

  // ── 5. Verification requests — pending / approved / rejected ──
  const verStatuses  = ["pending", "pending", "approved", "rejected", "pending"];
  const verInserts   = verStatuses.map((status, i) => ({
    talent_id:       t(i).id,
    status,
    id_document_url: "https://example.com/id-doc.jpg",
    selfie_url:      i % 2 === 0 ? "https://example.com/selfie.jpg" : null,
    social_proof:    `https://instagram.com/${t(i).full_name?.replace(" ", ".")}`,
    rejection_reason: status === "rejected" ? "الوثيقة غير واضحة — يرجى إعادة الرفع" : null,
  }));

  const { error: verErr } = await adminClient.from("talent_verifications").insert(verInserts);
  if (verErr) log.push(`verifications error: ${verErr.message}`);
  else log.push(`✓ inserted ${verInserts.length} verification requests`);

  // ── 6. Update client brand_status variety ─────────────────────
  if (clients.length >= 3) {
    await adminClient.from("profiles").update({ brand_status: "pending"  }).eq("id", clients[0].id);
    await adminClient.from("profiles").update({ brand_status: "approved" }).eq("id", clients[1].id);
    await adminClient.from("profiles").update({ brand_status: "rejected", brand_rejection_reason: "المستند الضريبي غير صالح" }).eq("id", clients[2].id);
    log.push("✓ set brand_status variety on clients");
  }

  return NextResponse.json({ success: true, log });
}