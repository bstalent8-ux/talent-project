// ─── Meta Graph API "actions" parsing — pure, unit-tested ──────────────────
// The Insights endpoint doesn't return a single "results" number — it returns
// an `actions` array of { action_type, value } pairs, one per action type
// Meta tracked for that row (link clicks, leads, messaging conversations,
// purchases, ...). Picking "the" result for a campaign card is a judgment
// call since the right one depends on the campaign's objective, which this
// dashboard doesn't fetch — RESULT_PRIORITY is a reasonable default order
// (a lead is a more meaningful "result" than a generic link click), not a
// guarantee it matches what Ads Manager itself would highlight.

export interface MetaAction {
  action_type: string;
  value: string;
}

function actionValue(actions: MetaAction[] | undefined, matchTypes: string[]): number {
  if (!actions) return 0;
  let total = 0;
  for (const a of actions) {
    if (matchTypes.some((t) => a.action_type === t || a.action_type.startsWith(t))) {
      total += Number(a.value) || 0;
    }
  }
  return total;
}

/** Click-to-Messenger / Click-to-WhatsApp conversation starts. Meta's Insights
 *  API only populates this for those two ad objectives — 0 for every other
 *  campaign, not an error. */
export function extractConversationsStarted(actions: MetaAction[] | undefined): number {
  return actionValue(actions, [
    "onsite_conversion.messaging_conversation_started_7d",
    "messaging_conversation_started",
  ]);
}

const RESULT_PRIORITY: { type: string; label: string }[] = [
  { type: "onsite_conversion.lead_grouped", label: "lead" },
  { type: "lead", label: "lead" },
  { type: "onsite_conversion.messaging_conversation_started_7d", label: "conversation" },
  { type: "messaging_conversation_started", label: "conversation" },
  { type: "purchase", label: "purchase" },
  { type: "onsite_conversion.purchase", label: "purchase" },
  { type: "landing_page_view", label: "landing_page_view" },
  { type: "link_click", label: "link_click" },
];

/** Best-effort single "result" for a campaign row, per RESULT_PRIORITY.
 *  Returns null when the actions array carries none of the known types
 *  (e.g. a brand-awareness campaign with only impression-based actions). */
export function pickPrimaryResult(actions: MetaAction[] | undefined): { count: number; type: string } | null {
  if (!actions) return null;
  for (const candidate of RESULT_PRIORITY) {
    const count = actionValue(actions, [candidate.type]);
    if (count > 0) return { count, type: candidate.label };
  }
  return null;
}

/** null when there were zero results — "cost per result" of a campaign that
 *  produced nothing isn't a number, it's undefined. */
export function costPerResult(spend: number, resultCount: number): number | null {
  if (resultCount <= 0) return null;
  return spend / resultCount;
}
