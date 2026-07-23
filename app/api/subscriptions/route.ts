export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createActiveSubscription } from "@/features/packages/services/package.service";

const subscriptionSchema = z.object({
  planId: z.string().uuid(),
  talentType: z.string().min(1).optional(),
  audience: z.enum(["talent", "brand"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = subscriptionSchema.parse(await req.json());
    const subscription = await createActiveSubscription({
      userId: user.id,
      planId: body.planId,
      talentType: body.talentType,
      audience: body.audience,
    });

    return NextResponse.json({ subscription });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid subscription request", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Subscription failed";
    const status = message.includes("Only ") || message.includes("not available") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
