export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { fetchDueTalentFollowUps, markTalentActionsNotified } from "@/features/admin/services/admin.service";
import { createBulkNotifications } from "@/lib/notifications/service";
import { withI18n } from "@/lib/notifications/templates";

// Daily reminder check — same shape as app/api/cron/lead-follow-ups, not
// reachable from the admin UI or any user session. Triggered by an external
// scheduler (see .github/workflows/talent-follow-ups-cron.yml) since
// Cloudflare Pages doesn't run scheduled Workers the way plain Workers do.
//
// Auth is a shared secret, not requireAdmin() — there is no browser session
// making this request.
export async function POST(req: NextRequest) {
  const secret = process.env.TALENT_CRON_SECRET;
  const provided = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const due = await fetchDueTalentFollowUps();
  if (due.length === 0) return NextResponse.json({ notified: 0 });

  let notified = 0;
  const handledActionIds: string[] = [];

  for (const item of due) {
    // Only the admin who logged the action gets notified — a talent has no
    // "assigned_to" owner the way a lead does.
    if (!item.performedBy) {
      handledActionIds.push(item.actionId);
      continue;
    }

    const name = item.talentName;
    const content = withI18n(
      {
        title: { ar: "موعد متابعة موهبة", en: "Talent follow-up due" },
        message: {
          ar: name ? `حان وقت المتابعة مع ${name}` : "حان وقت المتابعة مع إحدى المواهب",
          en: name ? `Time to follow up with ${name}` : "Time to follow up with a talent",
        },
      },
      { talent_id: item.talentId }
    );

    const count = await createBulkNotifications([item.performedBy], { type: "TALENT_FOLLOW_UP_DUE", ...content });
    notified += count;
    handledActionIds.push(item.actionId);
  }

  await markTalentActionsNotified(handledActionIds);
  return NextResponse.json({ notified, actionsChecked: due.length });
}
