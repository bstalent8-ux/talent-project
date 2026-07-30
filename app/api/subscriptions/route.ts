export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { createActiveSubscription } from "@/features/packages/services/package.service";
import { notifySubscriptionUpdated } from "@/lib/notifications/events";
import { canPerformAction } from "@/lib/permissions";

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

    const { data: profile } = await adminClient
      .from("profiles")
      .select("id, role, account_status, is_suspended")
      .eq("id", user.id)
      .single();
    if (!canPerformAction("subscribe", profile).allowed) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const body = subscriptionSchema.parse(await req.json());
    const subscription = await createActiveSubscription({
      userId: user.id,
      planId: body.planId,
      talentType: body.talentType,
      audience: body.audience,
    });

    // Confirm the plan change in the bell. Best-effort: a failed lookup just
    // means a less specific message, never a failed subscription.
    const { data: plan } = await adminClient
      .from("package_plans")
      .select("packages(name)")
      .eq("id", body.planId)
      .maybeSingle();

    const pkg = Array.isArray(plan?.packages) ? plan?.packages[0] : plan?.packages;

    await notifySubscriptionUpdated({
      recipientId:    user.id,
      packageName:    (pkg as { name?: string } | undefined)?.name ?? null,
      status:         (subscription as { status?: string } | null)?.status ?? null,
      subscriptionId: (subscription as { id?: string } | null)?.id ?? null,
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
