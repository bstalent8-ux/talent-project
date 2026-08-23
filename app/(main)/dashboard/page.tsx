export const runtime = 'edge';

export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getCachedUser } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { profileService } from "@/features/profiles";
import DashboardClient from "./_components/DashboardClient";

export default async function DashboardPage() {
  const user = await getCachedUser();
  if (!user) redirect("/login");

  const { data: profile } = await adminClient
    .from("profiles")
    .select("id, role, full_name, handle, city, avatar_url, brand_status")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/login");

  if (profile.role === "brand") {
    const { data: bookings } = await adminClient
      .from("bookings")
      .select("id, status, amount, created_at, service_type, brand_id, talent_user_id, job_id, talent_id")
      .eq("brand_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    const talentIds = [...new Set((bookings ?? []).map((b) => b.talent_user_id).filter(Boolean))];
    const { data: talents } = talentIds.length
      ? await adminClient.from("profiles").select("id, full_name, handle, avatar_url").in("id", talentIds)
      : { data: [] };
    const talentMap = Object.fromEntries((talents ?? []).map((t) => [t.id, t]));

    const recentBookings = (bookings ?? []).map((b) => ({
      ...b,
      talent: b.talent_user_id ? talentMap[b.talent_user_id] ?? null : null,
    }));

    return (
      <DashboardClient
        role="brand"
        profile={profile}
        brandStatus={profile.brand_status ?? "approved"}
        recentBookings={recentBookings}
      />
    );
  }

  // Talent (default) — via the provider layer, same pattern as
  // app/(main)/bookings/page.tsx.
  const ref = await profileService.resolveProviderRefSafe(user.id, "talent");
  const tp = ref
    ? await adminClient
        .from("talent_profiles")
        .select("id, category, status, avg_rating, total_reviews, profile_views")
        .eq("id", ref.providerProfileId)
        .maybeSingle()
        .then((r) => r.data)
    : null;

  let recentBookings: any[] = [];
  if (tp?.id) {
    const { data: bookings } = await adminClient
      .from("bookings")
      .select("id, status, amount, created_at, service_type, brand_id, talent_user_id, job_id, talent_id")
      .eq("talent_id", tp.id)
      .order("created_at", { ascending: false })
      .limit(5);

    const brandIds = [...new Set((bookings ?? []).map((b) => b.brand_id).filter(Boolean))];
    const { data: brands } = brandIds.length
      ? await adminClient.from("profiles").select("id, full_name, handle, avatar_url").in("id", brandIds)
      : { data: [] };
    const brandMap = Object.fromEntries((brands ?? []).map((b) => [b.id, b]));

    recentBookings = (bookings ?? []).map((b) => ({
      ...b,
      brand: brandMap[b.brand_id] ?? null,
    }));
  }

  return (
    <DashboardClient
      role="talent"
      profile={profile}
      talentProfile={tp}
      recentBookings={recentBookings}
    />
  );
}
