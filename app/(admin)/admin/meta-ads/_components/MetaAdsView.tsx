"use client";
import { useSite } from "@/contexts/SiteContext";
import DashboardCard from "@/components/admin/DashboardCard";
import { DollarSign, Eye, MousePointerClick, Target, MessageCircle, TrendingUp, Users, Percent } from "lucide-react";
import type { MetaAdsInsightsResult } from "@/features/meta-ads/types";
import { TrendLineChart, RankedBarList } from "./charts";

const TX = {
  ar: {
    notConfigured: "لسه محتاج تربط حساب ميتا",
    notConfiguredBody:
      "الداشبورد ده بيتصل بحساب الإعلانات بتاعك على ميتا (فيسبوك/انستجرام) عن طريق توكن قراءة فقط — مش محتاج موافقة رسمية من ميتا لأنه حسابك انت. محتاج تحط قيمتين في إعدادات السيرفر (.env):",
    step1: "1) System User Token من Meta Business Manager (بصلاحية ads_read على حسابك الإعلاني) → META_ADS_ACCESS_TOKEN",
    step2: "2) رقم الحساب الإعلاني (مثال: act_1234567890) → META_AD_ACCOUNT_ID",
    errorTitle: "معرفناش نجيب البيانات من ميتا",
    errorHint: "غالباً التوكن منتهي أو رقم الحساب غلط. راجع META_ADS_ACCESS_TOKEN و META_AD_ACCOUNT_ID.",
    spend: "الصرف", impressions: "مرات الظهور", reach: "الوصول", clicks: "الدوسات",
    ctr: "نسبة النقر (CTR)", results: "النتائج", costPerResult: "تكلفة كل نتيجة", conversations: "محادثات بدأت",
    spendTrend: "الصرف عبر الوقت", resultsTrend: "النتائج عبر الوقت",
    topCampaigns: "أعلى الحملات صرفاً",
    campaignsTable: "كل الحملات",
    campaign: "الحملة", noCampaigns: "لا توجد حملات في هذه الفترة.",
    conversationsNote: "\"محادثات بدأت\" رقم بترجعه ميتا لحملات Click-to-Messenger/WhatsApp بس — 0 يعني الحملة مش من النوع ده، مش خطأ.",
  },
  en: {
    notConfigured: "Meta account not connected yet",
    notConfiguredBody:
      "This dashboard reads your Meta (Facebook/Instagram) ad account via a read-only token — no formal Meta approval needed since it's your own account. Set two values in the server config (.env):",
    step1: "1) A System User Token from Meta Business Manager (with ads_read on your ad account) → META_ADS_ACCESS_TOKEN",
    step2: "2) Your ad account id (e.g. act_1234567890) → META_AD_ACCOUNT_ID",
    errorTitle: "Couldn't fetch data from Meta",
    errorHint: "Usually an expired token or a wrong account id. Check META_ADS_ACCESS_TOKEN and META_AD_ACCOUNT_ID.",
    spend: "Spend", impressions: "Impressions", reach: "Reach", clicks: "Clicks",
    ctr: "CTR", results: "Results", costPerResult: "Cost / Result", conversations: "Conversations Started",
    spendTrend: "Spend over time", resultsTrend: "Results over time",
    topCampaigns: "Top campaigns by spend",
    campaignsTable: "All campaigns",
    campaign: "Campaign", noCampaigns: "No campaigns in this range.",
    conversationsNote: "\"Conversations Started\" is Meta's own count for Click-to-Messenger/WhatsApp campaigns only — 0 means this campaign isn't that type, not a bug.",
  },
};

export default function MetaAdsView({ result }: { result: MetaAdsInsightsResult }) {
  const { dark, lang } = useSite();
  const t = TX[lang];
  const ar = lang === "ar";

  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const MUTED = dark ? "#94a3b8" : "#64748b";
  const TEXT = dark ? "#f1f5f9" : "#0f172a";
  const TH = dark ? "#0a121c" : "#f8fafc";
  const PRIMARY = "#1877F2"; // Meta blue — deliberate brand tie-in for this one page
  const AMBER = "#F4B740";

  if (!result.configured) {
    return (
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 28, maxWidth: 640 }}>
        <h3 style={{ margin: 0, marginBottom: 10, fontSize: 16, fontWeight: 700, color: TEXT }}>{t.notConfigured}</h3>
        <p style={{ margin: 0, marginBottom: 14, fontSize: 13.5, color: MUTED, lineHeight: 1.7 }}>{t.notConfiguredBody}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <code style={{ fontSize: 12.5, color: TEXT, background: TH, padding: "8px 10px", borderRadius: 8, direction: "ltr", textAlign: ar ? "right" : "left" }}>{t.step1}</code>
          <code style={{ fontSize: 12.5, color: TEXT, background: TH, padding: "8px 10px", borderRadius: 8, direction: "ltr", textAlign: ar ? "right" : "left" }}>{t.step2}</code>
        </div>
      </div>
    );
  }

  if (result.ok === false) {
    return (
      <div style={{ background: CARD, border: `1px solid #EF4444`, borderRadius: 16, padding: 24, maxWidth: 640 }}>
        <h3 style={{ margin: 0, marginBottom: 8, fontSize: 15, fontWeight: 700, color: "#EF4444" }}>{t.errorTitle}</h3>
        <p style={{ margin: 0, marginBottom: 6, fontSize: 13, color: MUTED }}>{t.errorHint}</p>
        <code style={{ display: "block", marginTop: 8, fontSize: 12, color: TEXT, background: TH, padding: "8px 10px", borderRadius: 8, direction: "ltr", textAlign: "left" }}>
          {result.error}
        </code>
      </div>
    );
  }

  const { totals, campaigns, daily, currency } = result;
  const fmtMoney = (v: number) => `${v.toLocaleString(ar ? "ar-EG" : "en-US", { maximumFractionDigits: 0 })} ${currency}`;
  const fmtNum = (v: number) => v.toLocaleString(ar ? "ar-EG" : "en-US");
  const fmtPct = (v: number) => `${v.toFixed(2)}%`;
  const dateLabel = (iso: string) =>
    new Date(iso).toLocaleDateString(ar ? "ar-EG" : "en-US", { month: "short", day: "numeric" });

  const cellStyle: React.CSSProperties = { padding: "10px 14px", borderBottom: `1px solid ${BORDER}`, fontSize: 13, color: TEXT, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" };
  const thStyle: React.CSSProperties = { padding: "9px 14px", color: MUTED, fontSize: 11.5, fontWeight: 700, textAlign: ar ? "right" : "left", backgroundColor: TH, borderBottom: `1px solid ${BORDER}`, whiteSpace: "nowrap" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
        <DashboardCard label={t.spend} value={fmtMoney(totals.spend)} color={PRIMARY} icon={<DollarSign size={20} />} />
        <DashboardCard label={t.results} value={fmtNum(totals.results)} color="#00D26A" icon={<Target size={20} />} />
        <DashboardCard label={t.costPerResult} value={totals.costPerResult !== null ? fmtMoney(totals.costPerResult) : "—"} color={AMBER} icon={<TrendingUp size={20} />} />
        <DashboardCard label={t.conversations} value={fmtNum(totals.conversationsStarted)} color="#8B5CF6" icon={<MessageCircle size={20} />} />
        <DashboardCard label={t.clicks} value={fmtNum(totals.clicks)} color="#60A5FA" icon={<MousePointerClick size={20} />} />
        <DashboardCard label={t.ctr} value={fmtPct(totals.ctr)} color="#F472B6" icon={<Percent size={20} />} />
        <DashboardCard label={t.impressions} value={fmtNum(totals.impressions)} color="#22D3EE" icon={<Eye size={20} />} />
        <DashboardCard label={t.reach} value={fmtNum(totals.reach)} color="#94A3B8" icon={<Users size={20} />} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 13, fontWeight: 700, color: TEXT }}>
            <span>{t.spendTrend}</span>
          </div>
          <TrendLineChart
            data={daily.map((d) => ({ label: dateLabel(d.date), value: d.spend }))}
            color={PRIMARY}
            formatValue={fmtMoney}
          />
        </div>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 13, fontWeight: 700, color: TEXT }}>
            <span>{t.resultsTrend}</span>
          </div>
          <TrendLineChart
            data={daily.map((d) => ({ label: dateLabel(d.date), value: d.results }))}
            color="#00D26A"
            formatValue={fmtNum}
          />
        </div>
      </div>

      {campaigns.length > 0 && (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
          <div style={{ marginBottom: 14, fontSize: 13, fontWeight: 700, color: TEXT }}>{t.topCampaigns}</div>
          <RankedBarList
            data={campaigns.map((c) => ({ label: c.campaignName, value: c.spend }))}
            color={PRIMARY}
            mutedColor={dark ? "#1e293b" : "#E2E8F0"}
            textColor={TEXT}
            formatValue={fmtMoney}
          />
        </div>
      )}

      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", fontSize: 13, fontWeight: 700, color: TEXT, borderBottom: `1px solid ${BORDER}` }}>
          {t.campaignsTable}
        </div>
        {campaigns.length === 0 ? (
          <p style={{ padding: 20, margin: 0, fontSize: 13, color: MUTED }}>{t.noCampaigns}</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>{t.campaign}</th>
                  <th style={thStyle}>{t.spend}</th>
                  <th style={thStyle}>{t.impressions}</th>
                  <th style={thStyle}>{t.clicks}</th>
                  <th style={thStyle}>{t.ctr}</th>
                  <th style={thStyle}>{t.results}</th>
                  <th style={thStyle}>{t.costPerResult}</th>
                  <th style={thStyle}>{t.conversations}</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.campaignId}>
                    <td style={{ ...cellStyle, whiteSpace: "normal", maxWidth: 260 }}>{c.campaignName}</td>
                    <td style={cellStyle}>{fmtMoney(c.spend)}</td>
                    <td style={cellStyle}>{fmtNum(c.impressions)}</td>
                    <td style={cellStyle}>{fmtNum(c.clicks)}</td>
                    <td style={cellStyle}>{fmtPct(c.ctr)}</td>
                    <td style={cellStyle}>{fmtNum(c.results)}</td>
                    <td style={cellStyle}>{c.costPerResult !== null ? fmtMoney(c.costPerResult) : "—"}</td>
                    <td style={cellStyle}>{fmtNum(c.conversationsStarted)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>{t.conversationsNote}</p>
    </div>
  );
}
