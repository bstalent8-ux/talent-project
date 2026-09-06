export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { fetchDueFollowUps, markActionsNotified } from "@/features/leads/services/leads.service";
import { createBulkNotifications } from "@/lib/notifications/service";
import { withI18n } from "@/lib/notifications/templates";

// Daily reminder check — NOT reachable from the admin UI or any user
// session. Cloudflare Pages doesn't run scheduled Workers the way plain
// Cloudflare Workers do, so this is triggered by an external scheduler (a
// GitHub Actions cron workflow hitting this URL once a day) instead of a
// wrangler.toml [triggers] cron. See CLAUDE.md's Leads CRM section for the
// workflow file and the CRON_SECRET this expects.
//
// Auth is a shared secret, not requireAdmin() — there is no browser session
// making this request.
export async function POST(req: NextRequest) {
  const secret = process.env.LEAD_CRON_SECRET;
  const provided = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const due = await fetchDueFollowUps();
  if (due.length === 0) return NextResponse.json({ notified: 0 });

  let notified = 0;
  const handledActionIds: string[] = [];

  for (const item of due) {
    // Both the admin who logged the action and the lead's current
    // assigned_to get notified — per the leads-CRM spec, they may differ.
    const recipients = Array.from(new Set([item.performedBy, item.assignedTo].filter((id): id is string => !!id)));
    if (recipients.length === 0) {
      handledActionIds.push(item.actionId);
      continue;
    }

    const name = item.leadName ?? (item.leadName === null ? "" : item.leadName);
    const content = withI18n(
      {
        title: { ar: "موعد فولو أب", en: "Follow-up due" },
        message: {
          ar: name ? `حان وقت المتابعة مع ${name}` : "حان وقت المتابعة مع أحد اللييدز",
          en: name ? `Time to follow up with ${name}` : "Time to follow up with a lead",
        },
      },
      { lead_id: item.leadId }
    );

    const count = await createBulkNotifications(recipients, { type: "LEAD_FOLLOW_UP_DUE", ...content });
    notified += count;
    handledActionIds.push(item.actionId);
  }

  await markActionsNotified(handledActionIds);
  return NextResponse.json({ notified, actionsChecked: due.length });
}
