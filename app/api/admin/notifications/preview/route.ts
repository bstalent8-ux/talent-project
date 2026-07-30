export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { countAudience } from "@/lib/notifications/service";
import { parseAudience } from "@/lib/notifications/validate";

// POST /api/admin/notifications/preview — dry run: how many people would this
// reach? Writes nothing.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await adminClient
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid json body" }, { status: 400 });

  const audience = parseAudience(body);
  if (audience.ok === false) return NextResponse.json({ error: audience.error }, { status: 400 });

  const count = await countAudience(audience.value);
  return NextResponse.json({ recipient_count: count });
}
