"use client";
import { Lock, ShieldCheck, Globe2 } from "lucide-react";
import type { SectionProps } from "./SettingsClient";

const TX = {
  ar: {
    title: "الخصوصية والأمان",
    passwordTitle: "كلمة المرور", passwordDesc: "لتغيير كلمة المرور، اذهب لقسم الحساب.",
    goToAccount: "الذهاب لقسم الحساب",
    visibilityTitle: "ظهور الملف الشخصي",
    talentApproved: "ملفك الشخصي معتمد وظاهر للعامة.",
    talentPending: "ملفك الشخصي قيد المراجعة — لسه مش ظاهر للعامة.",
    talentRejected: "ملفك الشخصي غير معتمد حاليًا.",
    talentNone: "لا يوجد ملف شخصي عام بعد.",
    brandApproved: "حساب شركتك معتمد.",
    brandPending: "حساب شركتك قيد المراجعة.",
    brandRejected: "حساب شركتك غير معتمد حاليًا.",
    note: "خيارات إضافية للخصوصية (مثل التحكم في من يقدر يتواصل معاك، أو إدارة الجلسات النشطة) غير متاحة حاليًا.",
  },
  en: {
    title: "Privacy & Security",
    passwordTitle: "Password", passwordDesc: "To change your password, go to the Account section.",
    goToAccount: "Go to Account",
    visibilityTitle: "Profile Visibility",
    talentApproved: "Your profile is approved and publicly visible.",
    talentPending: "Your profile is under review — not yet publicly visible.",
    talentRejected: "Your profile is not currently approved.",
    talentNone: "No public profile yet.",
    brandApproved: "Your company account is approved.",
    brandPending: "Your company account is under review.",
    brandRejected: "Your company account is not currently approved.",
    note: "Additional privacy controls (e.g. who can contact you, active session management) aren't available yet.",
  },
};

export default function PrivacySection({ profile, talentStatus, lang, dark }: SectionProps) {
  const t = TX[lang];
  const TEXT   = dark ? "#FFFFFF" : "#0F172A";
  const MUTED  = dark ? "#A8B3C2" : "#64748B";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const SURFACE = dark ? "#0A121C" : "#F8FAFC";
  const GREEN  = "#00D26A";
  const GOLD   = "#F4B740";
  const RED    = "#EF4444";

  const status = profile.role === "brand" ? profile.brand_status : talentStatus;
  const visMsg =
    profile.role === "brand"
      ? status === "approved" ? t.brandApproved : status === "rejected" ? t.brandRejected : t.brandPending
      : status === "approved" ? t.talentApproved : status === "rejected" ? t.talentRejected : status === "pending" ? t.talentPending : t.talentNone;
  const visColor = status === "approved" ? GREEN : status === "rejected" ? RED : GOLD;

  return (
    <div>
      <h2 style={{ color: TEXT, fontSize: 17, fontWeight: 800, margin: "0 0 20px" }}>{t.title}</h2>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: 16, backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, marginBottom: 14 }}>
        <Lock size={18} color={GREEN} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>{t.passwordTitle}</p>
          <p style={{ color: MUTED, fontSize: 12.5, margin: 0 }}>{t.passwordDesc}</p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: 16, backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, marginBottom: 16 }}>
        <ShieldCheck size={18} color={visColor} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>{t.visibilityTitle}</p>
          <p style={{ color: visColor, fontSize: 12.5, margin: 0, fontWeight: 600 }}>{visMsg}</p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <Globe2 size={14} color={MUTED} style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ color: MUTED, fontSize: 11.5, lineHeight: 1.7, margin: 0 }}>{t.note}</p>
      </div>
    </div>
  );
}
