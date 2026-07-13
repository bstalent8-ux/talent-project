import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const PIPELINE = [
  "contacting",
  "brief_sent",
  "accepted",
  "payment_pending",
  "in_progress",
  "completed",
  "paid",
] as const;

type BookingStatus = typeof PIPELINE[number] | "cancelled";

// Valid transitions: admin can move forward, backward one step, or cancel from anywhere
function isValidTransition(from: string, to: string): boolean {
  if (to === "cancelled") return from !== "paid";
  const fi = PIPELINE.indexOf(from as typeof PIPELINE[number]);
  const ti = PIPELINE.indexOf(to   as typeof PIPELINE[number]);
  if (fi === -1 || ti === -1) return false;
  return Math.abs(ti - fi) <= 2; // allow ±2 steps for flexibility
}

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
  const { status, note } = await req.json() as { status: BookingStatus; note?: string };

  // Fetch current booking
  const { data: booking, error: fetchErr } = await adminClient
    .from("bookings")
    .select("id, status")
    .eq("id", id)
    .single();

  if (fetchErr || !booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  if (!isValidTransition(booking.status, status)) {
    return NextResponse.json(
      { error: `Invalid transition: ${booking.status} → ${status}` },
      { status: 400 }
    );
  }

  const extra: Record<string, unknown> = {};
  if (status === "completed") extra.completed_at = new Date().toISOString();
  if (status === "paid")      extra.paid_at      = new Date().toISOString();

  // Update booking status
  const { error: updateErr } = await adminClient
    .from("bookings")
    .update({ status, ...extra })
    .eq("id", id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // Write to booking_history
  await adminClient.from("booking_history").insert({
    booking_id:  id,
    from_status: booking.status,
    to_status:   status,
    changed_by:  admin.id,
    note:        note ?? null,
  });

  revalidatePath("/admin/bookings");
  return NextResponse.json({ ok: true, from: booking.status, to: status });
}
