export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { privateNoStoreHeaders } from "@/lib/cache";

const SELECTED_TYPES = ["ugc", "model", "other"] as const;
const MAX_TEXT_LEN = 200;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: privateNoStoreHeaders() });

  const body = await req.json().catch(() => null);
  const selectedType = body?.selected_type;
  if (!SELECTED_TYPES.includes(selectedType)) {
    return NextResponse.json({ error: "selected_type must be ugc, model, or other" }, { status: 400, headers: privateNoStoreHeaders() });
  }

  const otherTypeText = selectedType === "other" && typeof body?.other_type_text === "string"
    ? body.other_type_text.trim().slice(0, MAX_TEXT_LEN)
    : null;
  if (selectedType === "other" && !otherTypeText) {
    return NextResponse.json({ error: "other_type_text is required when selected_type is other" }, { status: 400, headers: privateNoStoreHeaders() });
  }

  const utmSource   = typeof body?.utm_source === "string" ? body.utm_source.trim().slice(0, MAX_TEXT_LEN) || null : null;
  const utmCampaign = typeof body?.utm_campaign === "string" ? body.utm_campaign.trim().slice(0, MAX_TEXT_LEN) || null : null;

  const { error } = await adminClient.from("talent_type_requests").insert({
    user_id:         user.id,
    selected_type:   selectedType,
    other_type_text: otherTypeText,
    utm_source:      utmSource,
    utm_campaign:    utmCampaign,
  });

  // Analytics-only — never block registration on this failing.
  if (error) {
    console.error("[talent-type-requests] insert failed", error.code, error.message);
    return NextResponse.json({ error: "save failed" }, { status: 500, headers: privateNoStoreHeaders() });
  }

  return NextResponse.json({ success: true }, { headers: privateNoStoreHeaders() });
}
