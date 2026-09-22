"use client";
import { useEffect, useState } from "react";
import {
  User, UserCog, Bell, ShieldCheck, Languages, LifeBuoy,
} from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import { useIsMobile } from "@/hooks/useIsMobile";
import AccountSection from "./AccountSection";
import ProfileSection from "./ProfileSection";
import NotificationsSection from "./NotificationsSection";
import PrivacySection from "./PrivacySection";
import AppearanceSection from "./AppearanceSection";
import SupportSection from "./SupportSection";
import type { MarketplaceCategory } from "@/features/categories/types";

export interface SettingsProfile {
  id: string;
  role: string;
  full_name: string | null;
  handle: string | null;
  city: string | null;
  bio: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  brand_status: string | null;
  brand_category: string | null;
  tax_document_url: string | null;
  brand_verification_photos: string[] | null;
  brand_rejection_reason: string | null;
}

interface Props {
  profile: SettingsProfile;
  email: string | null;
  talentStatus: string | null;
  talentCategory: string | null;
  brandCategories: MarketplaceCategory[];
}

type SectionKey = "account" | "profile" | "notifications" | "privacy" | "appearance" | "support";

export interface SectionProps {
  profile: SettingsProfile;
  email: string | null;
  talentStatus: string | null;
  talentCategory: string | null;
  brandCategories: MarketplaceCategory[];
  dark: boolean;
  lang: "ar" | "en";
  isMobile: boolean;
}

const SECTIONS: { key: SectionKey; icon: React.ComponentType<{ size?: number; color?: string }> }[] = [
  { key: "account",       icon: User },
  { key: "profile",       icon: UserCog },
  { key: "notifications", icon: Bell },
  { key: "privacy",       icon: ShieldCheck },
  { key: "appearance",    icon: Languages },
  { key: "support",       icon: LifeBuoy },
];

const TX = {
  ar: {
    title: "الإعدادات",
    account: "الحساب", profile: "الملف الشخصي", notifications: "الإشعارات",
    privacy: "الخصوصية والأمان", appearance: "اللغة والمظهر", support: "الدعم",
  },
  en: {
    title: "Settings",
    account: "Account", profile: "Profile", notifications: "Notifications",
    privacy: "Privacy & Security", appearance: "Language & Appearance", support: "Support",
  },
};

export default function SettingsClient({ profile, email, talentStatus, talentCategory, brandCategories }: Props) {
  const { dark, lang } = useSite();
  const isMobile = useIsMobile();
  const t = TX[lang];
  const ar = lang === "ar";

  const CARD   = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const TEXT   = dark ? "#FFFFFF" : "#0F172A";
  const MUTED  = dark ? "#A8B3C2" : "#64748B";
  const BG     = dark ? "#050B12" : "#F1F5F9";
  const GREEN  = "#00D26A";

  const [section, setSection] = useState<SectionKey>("account");

  // Read initial section from the URL on mount (deep-linkable, e.g. from
  // Navbar or a "Complete your profile" CTA), then keep the URL in sync via
  // replaceState (no full navigation) so refresh preserves the open tab.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("section");
    if (s && SECTIONS.some((sec) => sec.key === s)) setSection(s as SectionKey);
  }, []);

  function changeSection(key: SectionKey) {
    setSection(key);
    const url = new URL(window.location.href);
    url.searchParams.set("section", key);
    window.history.replaceState(null, "", url.toString());
  }

  const navItem = (key: SectionKey, Icon: React.ComponentType<{ size?: number; color?: string }>) => {
    const active = section === key;
    return (
      <button
        key={key}
        onClick={() => changeSection(key)}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: isMobile ? "8px 14px" : "10px 14px",
          borderRadius: 10, border: "none", cursor: "pointer",
          backgroundColor: active ? "rgba(0,210,106,0.12)" : "transparent",
          color: active ? GREEN : MUTED,
          fontSize: 13.5, fontWeight: active ? 700 : 500,
          whiteSpace: "nowrap", flexShrink: 0,
          fontFamily: "'IBM Plex Sans Arabic', sans-serif",
          textAlign: ar ? "right" : "left",
          width: isMobile ? "auto" : "100%",
        }}
      >
        <Icon size={16} color={active ? GREEN : MUTED} />
        {t[key]}
      </button>
    );
  };

  const sectionProps = { profile, email, talentStatus, talentCategory, brandCategories, dark, lang, isMobile };

  return (
    <main dir={ar ? "rtl" : "ltr"} style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif", backgroundColor: BG, minHeight: "100vh", paddingBottom: 60 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "20px 16px" : "32px 24px" }}>
        <h1 style={{ color: TEXT, fontSize: isMobile ? 20 : 24, fontWeight: 900, margin: "0 0 20px" }}>{t.title}</h1>

        <div style={{ display: isMobile ? "flex" : "grid", flexDirection: isMobile ? "column" : undefined, gridTemplateColumns: isMobile ? undefined : "220px 1fr", gap: isMobile ? 16 : 24 }}>
          {/* Nav */}
          {isMobile ? (
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, WebkitOverflowScrolling: "touch" }}>
              {SECTIONS.map((s) => navItem(s.key, s.icon))}
            </div>
          ) : (
            <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 10, display: "flex", flexDirection: "column", gap: 2, height: "fit-content" }}>
              {SECTIONS.map((s) => navItem(s.key, s.icon))}
            </div>
          )}

          {/* Content */}
          <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: isMobile ? 16 : 24, minWidth: 0 }}>
            {section === "account" && <AccountSection {...sectionProps} />}
            {section === "profile" && <ProfileSection {...sectionProps} />}
            {section === "notifications" && <NotificationsSection {...sectionProps} />}
            {section === "privacy" && <PrivacySection {...sectionProps} />}
            {section === "appearance" && <AppearanceSection {...sectionProps} />}
            {section === "support" && <SupportSection {...sectionProps} />}
          </div>
        </div>
      </div>
    </main>
  );
}
