export const runtime = 'edge';

export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { getCachedUser } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { profileService } from "@/features/profiles";
import BookingsClient from "./_components/BookingsClient";

export default async function BookingsPage() {
  const user = await getCachedUser();
  if (!user) redirect("/login");

  const { data: profile } = await adminClient
    .from("profiles").select("role").eq("id", user.id).single();

  let bookings: Record<string, unknown>[] = [];

  if (profile?.role === "brand") {
    const { data } = await adminClient
      .from("bookings")
      // bookings has no budget_type/budget_amount/start_date/duration/deadline/
      // negotiation_message/updated_at columns — see app/api/bookings/route.ts.
      .select("id, status, amount, created_at, service_type, brand_id, talent_user_id, job_id, talent_id")
      .eq("brand_id", user.id)
      .order("created_at", { ascending: false });
    bookings = (data ?? []) as Record<string, unknown>[];
  } else {
    // talent_profiles.id via the provider layer. `talent_id` on bookings keeps
    // its exact meaning — only the lookup mechanism changed.
    // Safe variant: this page previously ignored the query error and rendered
    // an empty list.
    const ref = await profileService.resolveProviderRefSafe(user.id, "talent");
    const tp = ref ? { id: ref.providerProfileId } : null;
    if (tp) {
      const { data } = await adminClient
        .from("bookings")
        .select("id, status, amount, created_at, service_type, brand_id, talent_user_id, job_id, talent_id")
        .eq("talent_id", tp.id)
        .order("created_at", { ascending: false });
      bookings = (data ?? []) as Record<string, unknown>[];
    }
  }

  if (bookings.length) {
    const jobIds   = [...new Set(bookings.map((b) => b.job_id).filter(Boolean))] as string[];
    const brandIds = [...new Set(bookings.map((b) => b.brand_id))] as string[];
    const talentIds = [...new Set(bookings.map((b) => b.talent_user_id).filter(Boolean))] as string[];
    const bookingIds = bookings.map((b) => b.id) as string[];

    const [jobsRes, brandsRes, talentsRes, briefsRes] = await Promise.all([
      jobIds.length ? adminClient.from("jobs").select("id,title").in("id", jobIds) : { data: [] },
      brandIds.length ? adminClient.from("profiles").select("id,full_name,handle,avatar_url").in("id", brandIds) : { data: [] },
      talentIds.length ? adminClient.from("profiles").select("id,full_name,handle,avatar_url").in("id", talentIds) : { data: [] },
      bookingIds.length ? adminClient.from("booking_briefs").select("booking_id,id,title,status,deadline").in("booking_id", bookingIds) : { data: [] },
    ]);

    const jobMap    = Object.fromEntries((jobsRes.data ?? []).map((j) => [j.id, j]));
    const brandMap  = Object.fromEntries((brandsRes.data ?? []).map((p) => [p.id, p]));
    const talentMap = Object.fromEntries((talentsRes.data ?? []).map((p) => [p.id, p]));
    const briefMap  = Object.fromEntries((briefsRes.data ?? []).map((b) => [(b as Record<string, unknown>).booking_id, b]));

    bookings = bookings.map((b) => ({
      ...b,
      job:    b.job_id ? jobMap[b.job_id as string] : null,
      brand:  brandMap[b.brand_id as string] ?? null,
      talent: b.talent_user_id ? talentMap[b.talent_user_id as string] : null,
      brief:  briefMap[b.id as string] ?? null,
    }));
  }

  return <BookingsClient bookings={bookings as unknown as Parameters<typeof BookingsClient>[0]["bookings"]} myRole={profile?.role ?? "talent"} myId={user.id} />;
}
