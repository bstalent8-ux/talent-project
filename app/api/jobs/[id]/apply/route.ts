export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications/create";

// POST /api/jobs/[id]/apply — talent submits a proposal
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await adminClient
    .from("profiles").select("role").eq("id", user.id).single();

  const allowedRoles = ["talent", "freelancer", "ugc"];
  if (!profile || !allowedRoles.includes(profile.role))
    return NextResponse.json({ error: "only talents can apply" }, { status: 403 });

  const { data: job } = await adminClient
    .from("jobs").select("id, status, brand_id").eq("id", jobId).single();

  if (!job) return NextResponse.json({ error: "job not found" }, { status: 404 });
  if (job.status !== "open") return NextResponse.json({ error: "job is not open" }, { status: 400 });
  if (job.brand_id === user.id) return NextResponse.json({ error: "cannot apply to your own job" }, { status: 400 });

  // Check for duplicate application
  const { data: existing } = await adminClient
    .from("job_applications")
    .select("id, status, proposed_price, delivery_days, message")
    .eq("job_id", jobId).eq("talent_id", user.id).maybeSingle();

  if (existing) return NextResponse.json({ application: existing, already_applied: true });

  const body = await req.json().catch(() => ({}));
  const { message, proposed_price, delivery_days, portfolio_links } = body;

  const { data: application, error } = await adminClient
    .from("job_applications")
    .insert({
      job_id: jobId,
      talent_id: user.id,
      status: "pending",
      message: message ?? null,
      proposed_price: proposed_price ? Number(proposed_price) : null,
      delivery_days: delivery_days ? Number(delivery_days) : null,
      portfolio_links: portfolio_links ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify the brand that someone applied
  await createNotification({
    userId:        job.brand_id,
    type:          "job_application",
    title:         "طلب تقديم جديد",
    message:       message ?? "تقدّم أحد المواهب على وظيفتك",
    referenceId:   jobId,
    referenceType: "job",
  });

  return NextResponse.json({ application }, { status: 201 });
}

// GET /api/jobs/[id]/apply — check if current user already applied
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ applied: false });

  const { data } = await adminClient
    .from("job_applications")
    .select("id, status, proposed_price, delivery_days, message")
    .eq("job_id", jobId).eq("talent_id", user.id).maybeSingle();

  return NextResponse.json({ applied: !!data, application: data ?? null });
}