export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

function isNoRows(error: { code?: string } | null): boolean {
  return error?.code === "PGRST116";
}

// POST — brand pays the PLATFORM off-platform (bank transfer / InstaPay,
// not the talent directly — the platform pays the talent out after the work
// is approved, see the deliverables route's "release" step) and uploads a
// screenshot as proof. This does NOT move the booking forward by itself —
// only an admin can confirm the money actually landed
// (app/api/admin/bookings/[id]/payment/confirm), because the talent has no
// way to verify a transfer into an account that isn't theirs. Manual,
// admin-mediated confirmation until a real payment gateway is wired up
// (CLAUDE.md §12/§14).
//
// `payments` already has a real escrow shape (platform_fee/talent_payout are
// computed automatically, status is constrained to
// pending|held|released|refunded|disputed) — this route used to insert a
// non-existent `paid_at` column and an invalid `status: "paid"`, which is why
// the table has been empty and every booking has been stuck at "accepted".
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: booking, error: bookingError } = await adminClient
    .from("bookings")
    .select("brand_id,talent_id,talent_user_id,amount,status")
    .eq("id", id).single();
  if (bookingError) {
    const status = isNoRows(bookingError) ? 404 : 500;
    return NextResponse.json({ error: status === 404 ? "not found" : bookingError.message }, { status });
  }
  if (!booking) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (booking.brand_id !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (booking.status !== "accepted")
    return NextResponse.json({ error: "Booking must be in accepted state" }, { status: 400 });

  // A pending or already-held payment means proof was already submitted —
  // don't let a re-click create a second row.
  const { data: existingPayment } = await adminClient
    .from("payments").select("id,status").eq("booking_id", id).maybeSingle();
  if (existingPayment && existingPayment.status !== "disputed") {
    return NextResponse.json({ error: "Payment proof already submitted for this booking" }, { status: 409 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "no file provided" }, { status: 400 });

  const cloudName    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const folder       = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER ?? "talents";
  if (!cloudName || !uploadPreset) {
    return NextResponse.json({ error: "Cloudinary not configured" }, { status: 500 });
  }

  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", uploadPreset);
  fd.append("folder", `${folder}/payment-proofs`);

  const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: fd,
  });
  const cloudData = await cloudRes.json();
  if (!cloudData.secure_url) {
    return NextResponse.json(
      { error: "Cloudinary upload failed", detail: cloudData.error?.message ?? "unknown" },
      { status: 502 },
    );
  }
  const proofUrl = cloudData.secure_url as string;

  const paymentRow = {
    booking_id:     id,
    client_id:      booking.brand_id,
    // payments.talent_id FK -> talent_profiles.id, same ambiguity as
    // bookings.talent_id (CLAUDE.md §12 item 3) — NOT profiles.id, which is
    // what booking.talent_user_id holds.
    talent_id:      booking.talent_id,
    amount:         booking.amount ?? 0,
    currency:       "EGP",
    status:         "pending",
    // The check constraint's own allowed values are narrower than the
    // product concept — no "instapay"/"bank_transfer" option exists, only
    // offline|wallet|card|stripe|paymob. "offline" (also the column's own
    // DB default) is the correct fit for "brand transferred money outside
    // the platform, verified manually" — see CLAUDE.md's payment-proof
    // section for the rest of this constraint's discovered values.
    payment_method: "offline",
    proof_url:      proofUrl,
  };

  const { error: payErr } = existingPayment
    ? await adminClient.from("payments").update(paymentRow).eq("id", existingPayment.id)
    : await adminClient.from("payments").insert(paymentRow);
  if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 });

  // Notify via chat
  const { data: conv, error: convError } = await adminClient
    .from("conversations").select("id").eq("brand_id", user.id).eq("talent_id", booking.talent_user_id ?? "").maybeSingle();
  if (convError) return NextResponse.json({ error: convError.message }, { status: 500 });
  if (conv) {
    const { error: messageError } = await adminClient.from("messages").insert({
      conversation_id: conv.id,
      sender_id: user.id,
      content: `💳 تم رفع إثبات الدفع، وجاري مراجعته من فريق المنصة.\n💳 Payment proof uploaded — the platform team is reviewing it.`,
      message_type: "text",
    });
    if (messageError) return NextResponse.json({ error: messageError.message }, { status: 500 });
  }

  // No personal notification to the talent here — there's nothing for them
  // to act on yet (only an admin can confirm, see ./confirm's comment). The
  // chat message above is enough for transparency; admins see this booking
  // via /admin/bookings' own pending-payment indicator.

  return NextResponse.json({ success: true, status: "pending", proof_url: proofUrl });
}
