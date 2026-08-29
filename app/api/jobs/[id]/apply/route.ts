export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { notifyJobApplicationReceived } from "@/lib/notifications/events";
import { logJobApplication } from "@/lib/events/events";
import { canApplyJob } from "@/lib/permissions";
import { privateNoStoreHeaders } from "@/lib/cache";
import { applySchema } from "./schema";

// POST /api/jobs/[id]/apply — talent submits a proposal
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: privateNoStoreHeaders() });

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, role, account_status, is_suspended, talent_profiles(status)")
    .eq("id", user.id)
    .single();

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500, headers: privateNoStoreHeaders() });
  if (!profile) return NextResponse.json({ error: "profile not found" }, { status: 404, headers: privateNoStoreHeaders() });

  const talentProfiles = Array.isArray(profile.talent_profiles)
    ? profile?.talent_profiles
    : profile.talent_profiles
      ? [profile.talent_profiles]
      : [];
  const permission = canApplyJob({
    ...profile,
    talent_status: talentProfiles[0]?.status ?? null,
  });
  if (!permission.allowed) return NextResponse.json({ error: permission.reason === "role" ? "only talents can apply" : "forbidden" }, { status: 403, headers: privateNoStoreHeaders() });

  const { data: job, error: jobError } = await adminClient
    .from("jobs").select("id, status, brand_id, title").eq("id", jobId).single();

  if (jobError) {
    const status = jobError.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: status === 404 ? "job not found" : jobError.message }, { status, headers: privateNoStoreHeaders() });
  }
  if (!job) return NextResponse.json({ error: "job not found" }, { status: 404, headers: privateNoStoreHeaders() });
  if (job.status !== "open") return NextResponse.json({ error: "job is not open" }, { status: 400, headers: privateNoStoreHeaders() });
  if (job.brand_id === user.id) return NextResponse.json({ error: "cannot apply to your own job" }, { status: 400, headers: privateNoStoreHeaders() });

  // Check for duplicate application
  const { data: existing, error: existingError } = await adminClient
    .from("job_applications")
    .select("id, status, proposed_price, delivery_days, message")
    .eq("job_id", jobId).eq("talent_id", user.id).maybeSingle();

  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500, headers: privateNoStoreHeaders() });
  if (existing) return NextResponse.json({ application: existing, already_applied: true }, { headers: privateNoStoreHeaders() });

  let parsed: z.infer<typeof applySchema>;
  try {
    parsed = applySchema.parse(await req.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", issues: err.issues }, { status: 400, headers: privateNoStoreHeaders() });
    }
    return NextResponse.json({ error: "invalid request body" }, { status: 400, headers: privateNoStoreHeaders() });
  }
  const { message, proposed_price, delivery_days, portfolio_links } = parsed;

  const { data: application, error } = await adminClient
    .from("job_applications")
    .insert({
      job_id: jobId,
      talent_id: user.id,
      status: "pending",
      message,
      proposed_price,
      delivery_days: delivery_days ?? null,
      portfolio_links: portfolio_links ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: privateNoStoreHeaders() });

  // Notify the brand that someone applied
  const { data: talent, error: talentError } = await adminClient
    .from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  if (talentError) {
    console.error("Failed to load talent name for job notification:", talentError.message);
  }

  await notifyJobApplicationReceived({
    jobId,
    jobTitle:      job.title,
    applicationId: application.id,
    brandId:       job.brand_id,
    talentId:      user.id,
    talentName:    talent?.full_name ?? null,
    message,
  });

  await logJobApplication({ talentId: user.id, jobId, applicationId: application.id });

  return NextResponse.json({ application }, { status: 201, headers: privateNoStoreHeaders() });
}

// GET /api/jobs/[id]/apply — check if current user already applied
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ applied: false }, { headers: privateNoStoreHeaders() });

  const { data, error } = await adminClient
    .from("job_applications")
    .select("id, status, proposed_price, delivery_days, message")
    .eq("job_id", jobId).eq("talent_id", user.id).maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: privateNoStoreHeaders() });
  return NextResponse.json({ applied: !!data, application: data ?? null }, { headers: privateNoStoreHeaders() });
}
