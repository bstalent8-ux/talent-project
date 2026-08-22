export const runtime = 'edge';

export const dynamic = "force-dynamic";
import { redirect, notFound } from "next/navigation";
import { getCachedUser } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { profileService } from "@/features/profiles";
import BookingDetail from "./_components/BookingDetail";

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCachedUser();
  if (!user) redirect("/login");

  const { data: booking, error } = await adminClient
    .from("bookings")
    // bookings has no budget_type/budget_amount/start_date/duration/deadline/
    // negotiation_message/negotiation_requested_at/updated_at columns — see
    // app/api/bookings/route.ts.
    .select("id, status, amount, created_at, service_type, brand_id, talent_user_id, talent_id, job_id, job_application_id, paid_at, completed_at, notes")
    .eq("id", id)
    .single();

  if (error || !booking) notFound();

  const isBrand  = booking.brand_id === user.id;
  const isTalent = booking.talent_user_id === user.id;

  // Fallback check via talent_profiles for old bookings without talent_user_id
  let myRole: "brand" | "talent" = "brand";
  if (isBrand) {
    myRole = "brand";
  } else if (isTalent) {
    myRole = "talent";
  } else {
    // Same lookup as before, through the provider layer. The comparison target
    // is still booking.talent_id, and the authorization rule is untouched.
    const ref = await profileService.resolveProviderRefSafe(user.id, "talent");
    const tp = ref ? { id: ref.providerProfileId } : null;
    if (tp && tp.id === booking.talent_id) myRole = "talent";
    else redirect("/bookings");
  }

  const [brandRes, talentRes, jobRes, briefRes, delivRes, payRes, reviewRes, convRes] = await Promise.all([
    adminClient.from("profiles").select("id,full_name,handle,avatar_url,is_verified").eq("id", booking.brand_id).single(),
    booking.talent_user_id
      ? adminClient.from("profiles").select("id,full_name,handle,avatar_url,is_verified").eq("id", booking.talent_user_id).single()
      : Promise.resolve({ data: null }),
    booking.job_id
      ? adminClient.from("jobs").select("id,title,description,category").eq("id", booking.job_id).single()
      : Promise.resolve({ data: null }),
    adminClient.from("booking_briefs").select("*").eq("booking_id", id).maybeSingle(),
    adminClient.from("deliverables").select("*").eq("booking_id", id).order("created_at", { ascending: false }),
    adminClient.from("payments").select("*").eq("booking_id", id).maybeSingle(),
    adminClient.from("reviews").select("id,rating,comment,status").eq("booking_id", id).maybeSingle(),
    booking.talent_user_id
      ? adminClient.from("conversations").select("id").eq("brand_id", booking.brand_id).eq("talent_id", booking.talent_user_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const enriched = {
    ...booking,
    brand:           brandRes.data,
    talent:          talentRes.data,
    job:             jobRes.data,
    brief:           briefRes.data,
    deliverables:    delivRes.data ?? [],
    payment:         payRes.data,
    review:          reviewRes.data,
    conversation_id: convRes.data?.id ?? null,
  };

  return <BookingDetail booking={enriched as Parameters<typeof BookingDetail>[0]["booking"]} myRole={myRole} />;
}
