// ─── Meta Ads Insights — service (server only) ──────────────────────────────
// Read-only wrapper around Meta's Marketing API `/insights` endpoint for the
// /admin/meta-ads dashboard. Needs only a Business-Manager System User token
// with `ads_read` on the business's own ad account — no Meta App Review,
// since the business is reading its own account (contrast with Lead Ads
// retrieval or Messenger sync, which do need App Review — see CLAUDE.md).
//
// Server-only: reads process.env directly (edge runtime — no Node APIs used,
// just fetch). Never import this from a "use client" file.

import { extractConversationsStarted, pickPrimaryResult, costPerResult, type MetaAction } from "./parse";
import type {
  MetaAdsInsightsResult, MetaCampaignInsight, MetaDailyInsight, MetaAdsTotals, MetaDatePreset,
} from "./types";

function config() {
  const token = process.env.META_ADS_ACCESS_TOKEN;
  const accountId = process.env.META_AD_ACCOUNT_ID;
  const version = process.env.META_API_VERSION || "v21.0";
  if (!token || !accountId) return null;
  return { token, accountId, version };
}

export function isMetaAdsConfigured(): boolean {
  return config() !== null;
}

interface RawCampaignRow {
  campaign_id: string;
  campaign_name: string;
  spend?: string;
  impressions?: string;
  reach?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  actions?: MetaAction[];
}

interface RawDailyRow {
  date_start: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  actions?: MetaAction[];
}

interface GraphErrorBody {
  error?: { message?: string; type?: string; code?: number };
}

const FETCH_TIMEOUT_MS = 15_000;

async function graphGet<T>(url: string): Promise<{ data: T[] } | GraphErrorBody> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    const body = await res.json();
    if (!res.ok) return body as GraphErrorBody;
    return body as { data: T[] };
  } catch (err) {
    return { error: { message: err instanceof Error ? err.message : "network error" } };
  } finally {
    clearTimeout(timer);
  }
}

function n(v: string | undefined): number {
  return v ? Number(v) || 0 : 0;
}

export async function fetchMetaAdsInsights(datePreset: MetaDatePreset): Promise<MetaAdsInsightsResult> {
  const cfg = config();
  if (!cfg) return { configured: false };

  const { token, accountId, version } = cfg;
  const base = `https://graph.facebook.com/${version}/${accountId}`;
  const campaignFields = "campaign_id,campaign_name,spend,impressions,reach,clicks,ctr,cpc,cpm,actions";
  const dailyFields = "spend,impressions,clicks,actions";

  const campaignUrl = `${base}/insights?level=campaign&date_preset=${datePreset}&limit=500&fields=${campaignFields}&access_token=${token}`;
  const dailyUrl = `${base}/insights?level=account&date_preset=${datePreset}&time_increment=1&fields=${dailyFields}&access_token=${token}`;
  const accountUrl = `${base}?fields=currency&access_token=${token}`;

  const [campaignRes, dailyRes, accountRes] = await Promise.all([
    graphGet<RawCampaignRow>(campaignUrl),
    graphGet<RawDailyRow>(dailyUrl),
    fetch(accountUrl).then((r) => r.json()).catch(() => ({})) as Promise<{ currency?: string; error?: { message?: string } }>,
  ]);

  if ("error" in campaignRes && campaignRes.error) {
    return { configured: true, ok: false, error: campaignRes.error.message ?? "Meta API error" };
  }
  if ("error" in dailyRes && dailyRes.error) {
    return { configured: true, ok: false, error: dailyRes.error.message ?? "Meta API error" };
  }

  const campaignRows = "data" in campaignRes ? campaignRes.data : [];
  const dailyRows = "data" in dailyRes ? dailyRes.data : [];
  const currency = accountRes && "currency" in accountRes && accountRes.currency ? accountRes.currency : "EGP";

  const campaigns: MetaCampaignInsight[] = campaignRows.map((row) => {
    const spend = n(row.spend);
    const primary = pickPrimaryResult(row.actions);
    const results = primary?.count ?? 0;
    return {
      campaignId: row.campaign_id,
      campaignName: row.campaign_name,
      spend,
      impressions: n(row.impressions),
      reach: n(row.reach),
      clicks: n(row.clicks),
      ctr: n(row.ctr),
      cpc: n(row.cpc),
      cpm: n(row.cpm),
      results,
      resultType: primary?.type ?? null,
      costPerResult: costPerResult(spend, results),
      conversationsStarted: extractConversationsStarted(row.actions),
    };
  });

  const daily: MetaDailyInsight[] = dailyRows.map((row) => {
    const primary = pickPrimaryResult(row.actions);
    return {
      date: row.date_start,
      spend: n(row.spend),
      clicks: n(row.clicks),
      impressions: n(row.impressions),
      conversationsStarted: extractConversationsStarted(row.actions),
      results: primary?.count ?? 0,
    };
  });

  const totals: MetaAdsTotals = campaigns.reduce<MetaAdsTotals>(
    (acc, c) => ({
      spend: acc.spend + c.spend,
      impressions: acc.impressions + c.impressions,
      reach: acc.reach + c.reach,
      clicks: acc.clicks + c.clicks,
      ctr: 0, // recomputed below — averaging per-row CTR would be wrong
      cpc: 0,
      results: acc.results + c.results,
      conversationsStarted: acc.conversationsStarted + c.conversationsStarted,
      costPerResult: null,
    }),
    { spend: 0, impressions: 0, reach: 0, clicks: 0, ctr: 0, cpc: 0, results: 0, conversationsStarted: 0, costPerResult: null },
  );
  totals.ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  totals.cpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
  totals.costPerResult = costPerResult(totals.spend, totals.results);

  return { configured: true, ok: true, totals, campaigns, daily, currency };
}
