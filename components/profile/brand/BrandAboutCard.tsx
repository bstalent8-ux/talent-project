"use client";

import { FileText } from "lucide-react";
import BrandCard, { useBrandPalette } from "./BrandCard";

const TX = {
  ar: { title: "نبذة عن العلامة" },
  en: { title: "About" },
};

/**
 * Renders nothing when there is no bio. The section-content rule already hides
 * this section server-side; the null here is what keeps the component honest if
 * it is ever mounted directly, outside the renderer.
 */
export default function BrandAboutCard({ bio }: { bio: string | null }) {
  const { ar, MUTED } = useBrandPalette();
  const tx = TX[ar ? "ar" : "en"];

  if (!bio || !bio.trim()) return null;

  return (
    <BrandCard icon={<FileText size={18} color="#00D26A" />} title={tx.title}>
      <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.9, margin: 0, whiteSpace: "pre-wrap" }}>
        {bio}
      </p>
    </BrandCard>
  );
}
