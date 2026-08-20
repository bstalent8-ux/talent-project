export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { privateNoStoreHeaders } from "@/lib/cache";
import { notifyAdminNewTestimonial } from "@/lib/notifications/events";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: privateNoStoreHeaders() });

  const body = await req.json().catch(() => null);
  const quote = typeof body?.quote === "string" ? body.quote.trim() : "";
  const authorRole = typeof body?.authorRole === "string" ? body.authorRole.trim() : null;
  const company = typeof body?.company === "string" ? body.company.trim() : null;

  if (!quote) {
    return NextResponse.json({ error: "quote required" }, { status: 400, headers: privateNoStoreHeaders() });
  }

  const { data: profile } = await adminClient
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const authorName = profile?.full_name ?? "-";

  const { data: row, error } = await adminClient
    .from("landing_testimonials")
    .insert({
      submitter_id: user.id,
      quote,
      author_name: authorName,
      author_role: authorRole,
      company,
      status: "pending",
    })
    .select("id, status")
    .single();

  if (error) {
    return NextResponse.json({ error: "insert failed" }, { status: 500, headers: privateNoStoreHeaders() });
  }

  notifyAdminNewTestimonial({ submitterId: user.id, submitterName: authorName }).catch((e) => {
    console.error("[landing/testimonials] admin notify failed", e);
  });

  return NextResponse.json({ data: row }, { status: 201, headers: privateNoStoreHeaders() });
}
