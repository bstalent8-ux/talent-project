export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireAdmin, getAdminUser } from "@/lib/auth/require-admin";
import { requirePermission } from "@/lib/auth/permissions";
import { fetchAdminBookingDetail } from "@/features/admin/services/admin.service";
import { revalidatePath } from "next/cache";

// GET — full booking detail for /admin/bookings/[id]: brief, deliverables,
// payment, review, the booking_history audit trail, and the chat transcript.
// See features/admin/services/admin.service.ts's fetchAdminBookingDetail for
// how each piece is resolved.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;
  const denied = await requirePermission("bookings", "read");
  if (denied) return denied;

  const { id } = await params;
  const booking = await fetchAdminBookingDetail(id);
  if (!booking) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({ booking });
}

const PIPELINE = [
  "pending",
  "changes_requested",
  "contacting",
  "brief_sent",
  "accepted",
  "payment_pending",
  "in_progress",
  "completed",
  "paid",
] as const;

type BookingStatus = typeof PIPELINE[number] | "rejected" | "cancelled";

// Valid transitions: admin can move forward, backward one step, or cancel from anywhere
function isValidTransition(from: string, to: string): boolean {
  if (to === "cancelled") return from !== "paid";
  if (to === "rejected") return !["paid", "completed"].includes(from);
  const fi = PIPELINE.indexOf(from as typeof PIPELINE[number]);
  const ti = PIPELINE.indexOf(to   as typeof PIPELINE[number]);
  if (fi === -1 || ti === -1) return false;
  return Math.abs(ti - fi) <= 2; // allow ±2 steps for flexibility
}

// PATCH — the generic status-stepper BookingsTable's prev/next/cancel
// buttons use. Deliberately blunt (a plain status write) — it does NOT know
// about the `payments` table, which is exactly why BookingsTable hides the
// "next" stepper for a booking with a pending payment proof and routes that
// one case through POST .../payment/confirm instead (see that route's
// comment and CLAUDE.md's "Manual Payment Proof Flow" section).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requirePermission("bookings", "update");
  if (denied) return denied;
  const admin = await getAdminUser();
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
