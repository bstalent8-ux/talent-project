"use client";

import { Building2, Globe } from "lucide-react";
import BrandCard, { useBrandPalette } from "./BrandCard";

const TX = {
  ar: { title: "بيانات الشركة", name: "الاسم التجاري", website: "الموقع الإلكتروني" },
  en: { title: "Company details", name: "Legal name", website: "Website" },
};

/** Strips the scheme for display; the href keeps it. */
function displayHost(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

/** Only http(s) becomes a link — a stored `javascript:` value must never be one. */
function safeHref(url: string): string | null {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[\w.-]+\.[a-z]{2,}/i.test(trimmed)) return `https://${trimmed}`;
  return null;
}

export default function BrandCompanyCard({
  companyName,
  websiteUrl,
}: {
  companyName: string | null;
  websiteUrl:  string | null;
}) {
  const { ar, TEXT, MUTED, GREEN } = useBrandPalette();
  const tx = TX[ar ? "ar" : "en"];

  if (!companyName && !websiteUrl) return null;

  const href = websiteUrl ? safeHref(websiteUrl) : null;

  return (
    <BrandCard icon={<Building2 size={18} color={GREEN} />} title={tx.title}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {companyName && (
          <div>
            <p style={{ color: MUTED, fontSize: 12, fontWeight: 700, margin: "0 0 4px" }}>{tx.name}</p>
            <p style={{ color: TEXT, fontSize: 15, fontWeight: 700, margin: 0 }}>{companyName}</p>
          </div>
        )}

        {href && (
          <div>
            <p style={{ color: MUTED, fontSize: 12, fontWeight: 700, margin: "0 0 4px" }}>{tx.website}</p>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              style={{
                color: GREEN, fontSize: 14, fontWeight: 700, textDecoration: "none",
                display: "inline-flex", alignItems: "center", gap: 6,
              }}
            >
              <Globe size={14} color={GREEN} />
              {displayHost(href)}
            </a>
          </div>
        )}
      </div>
    </BrandCard>
  );
}
