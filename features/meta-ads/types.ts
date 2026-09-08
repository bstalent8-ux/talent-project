// ─── Meta Ads Insights — types ──────────────────────────────────────────────
// Domain shapes for the read-only /admin/meta-ads dashboard. Raw Graph API
// response shapes stay in service.ts (they're a third party's contract, not
// ours) — only what the UI actually renders lives here.

/** One row of Meta's per-campaign totals for the selected date range. */
export interface MetaCampaignInsight {
  campaignId:   string;
  campaignName: string;
  spend:        number;   // account currency
  impressions:  number;
  reach:        number;
  clicks:       number;
  ctr:          number;   // percent, e.g. 2.35
  cpc:          number;   // cost per click, account currency
  cpm:          number;   // cost per 1,000 impressions
  results:      number;   // this campaign's objective-defined result count
  resultType:   string | null; // e.g. "onsite_conversion.lead", "link_click"
  costPerResult: number | null;
  conversationsStarted: number; // messaging_conversation_started — 0 for non-Messenger objectives
}

/** One day of account-wide totals — the x-axis of the trend graph. */
export interface MetaDailyInsight {
  date:   string; // YYYY-MM-DD
  spend:  number;
  clicks: number;
  impressions: number;
  conversationsStarted: number;
  results: number;
}

export interface MetaAdsTotals {
  spend:  number;
  impressions: number;
  reach:  number;
  clicks: number;
  ctr:    number;
  cpc:    number;
  results: number;
  conversationsStarted: number;
  costPerResult: number | null;
}

export const META_DATE_PRESETS = [
  "today", "yesterday", "last_7d", "last_14d", "last_30d", "last_90d", "this_month", "last_month",
] as const;
export type MetaDatePreset = (typeof META_DATE_PRESETS)[number];

export type MetaAdsInsightsResult =
  | { configured: false }
  | { configured: true; ok: true; totals: MetaAdsTotals; campaigns: MetaCampaignInsight[]; daily: MetaDailyInsight[]; currency: string }
  | { configured: true; ok: false; error: string };
