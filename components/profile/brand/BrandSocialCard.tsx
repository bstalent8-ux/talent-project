"use client";

import { Share2 } from "lucide-react";
import BrandCard, { useBrandPalette } from "./BrandCard";

const TX = {
  ar: { title: "مواقع التواصل" },
  en: { title: "Social media" },
};

/**
 * Order is display order. Keys match BRAND_SOCIAL_KEYS in
 * features/profiles/content/section-content.ts — a platform added there without
 * an entry here would count for visibility but render nothing.
 */
const PLATFORMS: Array<{ key: string; label: string; base: string; color: string }> = [
  { key: "instagram", label: "Instagram", base: "https://instagram.com/",   color: "#E1306C" },
  { key: "tiktok",    label: "TikTok",    base: "https://tiktok.com/@",     color: "#010101" },
  { key: "youtube",   label: "YouTube",   base: "https://youtube.com/@",    color: "#FF0000" },
  { key: "linkedin",  label: "LinkedIn",  base: "https://linkedin.com/in/", color: "#0A66C2" },
  { key: "facebook",  label: "Facebook",  base: "https://facebook.com/",    color: "#1877F2" },
  { key: "x",         label: "X",         base: "https://x.com/",           color: "#0F1419" },
];

/** A stored value may be a full URL or a bare handle. Both must resolve. */
function toHref(base: string, raw: string): string | null {
  const value = raw.trim().replace(/^@/, "");
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (/[^\w.-]/.test(value)) return null;
  return `${base}${value}`;
}

export default function BrandSocialCard({ socialLinks }: { socialLinks: Record<string, unknown> }) {
  const { ar, dark, TEXT, BORDER, GREEN } = useBrandPalette();
  const tx = TX[ar ? "ar" : "en"];

  const links = PLATFORMS.flatMap((platform) => {
    const raw = socialLinks?.[platform.key];
    if (typeof raw !== "string" || raw.trim().length <= 2) return [];
    const href = toHref(platform.base, raw);
    return href ? [{ ...platform, href }] : [];
  });

  if (links.length === 0) return null;

  return (
    <BrandCard icon={<Share2 size={18} color={GREEN} />} title={tx.title}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {links.map((link) => (
          <a
            key={link.key}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 10,
              border: `1px solid ${BORDER}`,
              backgroundColor: dark ? "rgba(255,255,255,0.02)" : "#F8FAFC",
              color: TEXT, fontSize: 13, fontWeight: 700, textDecoration: "none",
            }}
          >
            <span
              style={{
                width: 8, height: 8, borderRadius: "50%",
                backgroundColor: link.color, flexShrink: 0,
              }}
            />
            {link.label}
          </a>
        ))}
      </div>
    </BrandCard>
  );
}
