"use client";

// ─── Trust & Verification (Model public profile only) ──────────────────────
// Sidebar chrome, same category as AvailabilityCard/BriefCard/QuestionCard —
// mounted directly by TalentProfileShell for category === "model", not
// through the core-key pipeline (no new section key invented).
//
// Every row here is gated on a real, already-fetched signal. No escrow/
// payment-protection claim is made: CLAUDE.md is explicit that no escrow or
// payment provider exists in this system (manual payment confirmation only)
// — TrustCard.tsx elsewhere already makes that claim as pre-existing,
// out-of-scope copy; this new card does not repeat it.

import { Star, ShieldCheck, BadgeCheck, CheckCircle2 } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import { useIsMobile } from "@/hooks/useIsMobile";

interface Props {
  /** profiles.is_verified — the general trust badge, already surfaced elsewhere as "Verified". */
  verified?: boolean;
  /** talent_verifications has an admin-approved row (ID doc + selfie). */
  identityVerified?: boolean;
  /** bookings.status === "completed" count for this talent. */
  completedProjects?: number;
  /** talent_profiles.total_reviews (approved reviews only). */
  reviewCount?: number;
}

export default function TrustVerificationCard({ verified, identityVerified, completedProjects = 0, reviewCount = 0 }: Props) {
  const { dark, lang } = useSite();
  const isMobile = useIsMobile();
  const ar = lang === "ar";

  const rows = [
    verified && {
      icon: <BadgeCheck size={15} color="var(--color-primary)" />,
      label: ar ? "ملف موثّق" : "Verified Profile",
    },
    identityVerified && {
      icon: <ShieldCheck size={15} color="var(--color-primary)" />,
      label: ar ? "الهوية موثّقة" : "Identity Verified",
    },
    completedProjects > 0 && {
      icon: <CheckCircle2 size={15} color="var(--color-primary)" />,
      label: ar
        ? `${completedProjects} مشروع مكتمل عبر Talents`
        : `${completedProjects} completed project${completedProjects === 1 ? "" : "s"} via Talents`,
    },
    reviewCount > 0 && {
      icon: <Star size={15} color="var(--color-secondary)" fill="var(--color-secondary)" />,
      label: ar
        ? `تقييمات من ${reviewCount} عمل مكتمل`
        : `Reviews from ${reviewCount} completed work${reviewCount === 1 ? "" : "s"}`,
    },
  ].filter(Boolean) as { icon: React.ReactNode; label: string }[];

  // Nothing real to prove — no card, not a card full of blank claims.
  if (rows.length === 0) return null;

  return (
    <div style={{
      backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)",
      borderRadius: 16, padding: isMobile ? 16 : 20,
    }}>
      <h3 style={{ color: "var(--text-primary)", fontSize: 14, fontWeight: 800, margin: "0 0 12px" }}>
        {ar ? "الثقة والتحقق" : "Trust & Verification"}
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map((row, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {row.icon}
            <span style={{ color: "var(--text-muted)", fontSize: 12.5 }}>{row.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
