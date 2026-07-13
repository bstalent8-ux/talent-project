export const runtime = 'edge';

export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import ApplicationsClient from "./_components/ApplicationsClient";

export default async function ApplicationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await adminClient
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "brand") redirect("/jobs");

  const { data: job } = await adminClient
    .from("jobs")
    .select("id, title, brand_id, description, category, budget_min, budget_max, currency, status, slots, created_at")
    .eq("id", jobId).single();

  if (!job || job.brand_id !== user.id) redirect("/jobs");

  const { data: apps } = await adminClient
    .from("job_applications")
    .select("id, talent_id, status, message, proposed_price, delivery_days, portfolio_links, reject_reason, created_at")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  const talentIds = [...new Set((apps ?? []).map((a) => a.talent_id))];
  const [{ data: profiles }, { data: talentProfiles }] = await Promise.all([
    talentIds.length
      ? adminClient.from("profiles").select("id, full_name, handle, avatar_url, city, is_verified").in("id", talentIds)
      : { data: [] },
    talentIds.length
      ? adminClient.from("talent_profiles").select("id, user_id, avg_rating, total_reviews, category").in("user_id", talentIds)
      : { data: [] },
  ]);

  const profileMap    = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
  const talentMap     = Object.fromEntries((talentProfiles ?? []).map((t) => [t.user_id, t]));
  const enrichedApps  = (apps ?? []).map((a) => ({
    ...a,
    talent:         profileMap[a.talent_id] ?? null,
    talent_profile: talentMap[a.talent_id]  ?? null,
  }));

  return <ApplicationsClient job={job} applications={enrichedApps} brandId={user.id} />;
}