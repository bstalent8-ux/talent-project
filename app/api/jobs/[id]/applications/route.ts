import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

// GET /api/jobs/[id]/applications — brand lists all proposals for a job
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Verify caller owns this job
  const { data: job } = await adminClient
    .from("jobs").select("id, title, brand_id, budget_min, budget_max, currency, status")
    .eq("id", jobId).single();

  if (!job) return NextResponse.json({ error: "job not found" }, { status: 404 });
  if (job.brand_id !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { data: apps, error } = await adminClient
    .from("job_applications")
    .select("id, talent_id, status, message, proposed_price, delivery_days, portfolio_links, reject_reason, created_at")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with talent profile data
  const talentIds = [...new Set((apps ?? []).map((a) => a.talent_id))];
  const [{ data: profiles }, { data: talentProfiles }] = await Promise.all([
    talentIds.length
      ? adminClient.from("profiles").select("id, full_name, handle, avatar_url, city, is_verified")
          .in("id", talentIds)
      : { data: [] },
    talentIds.length
      ? adminClient.from("talent_profiles")
          .select("id, user_id, avg_rating, total_reviews, category, bio")
          .in("user_id", talentIds)
      : { data: [] },
  ]);

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
  const talentMap  = Object.fromEntries((talentProfiles ?? []).map((t) => [t.user_id, t]));

  const enriched = (apps ?? []).map((a) => ({
    ...a,
    talent: profileMap[a.talent_id] ?? null,
    talent_profile: talentMap[a.talent_id] ?? null,
  }));

  return NextResponse.json({ job, applications: enriched });
}
