import type { AddonItem } from "@/features/talent-profile/types";

// No "server-only" guard here — the fallback arrays are also imported by
// UgcProfileShell.tsx / ModelProfileShell.tsx (client components) so the
// price list shown on the page and the one the server validates against
// stay identical. Nothing in this file is sensitive.

// ─── Usage-rights add-ons — single source of truth for price ───────────────
// Real add-ons live in talent_profiles.social_links.usage_addons (JSONB,
// same as components/profile/dynamic/adapters/talent.context.ts's toAddons()
// reads from the profile DTO — this is the raw-row equivalent, used where a
// route only has the DB row, not the full profile-service pipeline).
// UgcProfileShell.tsx / ModelProfileShell.tsx import the fallback arrays
// from here too, so the client display and the server-side price check can
// never drift apart.
//
// Keys are identical between the AR/EN fallback lists (only the label
// differs) — a price lookup by key never needs to know which language the
// viewer had selected.

export const FALLBACK_ADDONS_AR: AddonItem[] = [
  { key: "raw-material", label: "تسليم المواد الخام (Raw Footage)", price: 800 },
  { key: "extra-hour", label: "ساعة تصوير إضافية", price: 500 },
  { key: "extra-transition", label: "لوكيشن / انتقال إضافي", price: 600 },
];

export const FALLBACK_ADDONS_EN: AddonItem[] = [
  { key: "raw-material", label: "Raw footage delivery", price: 800 },
  { key: "extra-hour", label: "Extra shooting hour", price: 500 },
  { key: "extra-transition", label: "Extra location / transition", price: 600 },
];

/** Mirrors toAddons() in talent.context.ts, but reads the raw column value
 * directly instead of a PublicProfileDTO — for routes that only fetched
 * talent_profiles.social_links, not the full profile-service pipeline. */
export function parseUsageAddons(socialLinks: unknown): AddonItem[] | null {
  const raw = (socialLinks && typeof socialLinks === "object")
    ? (socialLinks as Record<string, unknown>)["usage_addons"]
    : null;
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const parsed: AddonItem[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    if (!row.label) continue;
    parsed.push({
      key:   String(row.key ?? row.label),
      label: String(row.label),
      price: Number(row.price ?? 0),
    });
  }
  return parsed.length > 0 ? parsed : null;
}

/** The real add-ons this talent has set, or the fallback list — the exact
 * list a brand actually sees on the profile page for this talent right now.
 * `lang` only picks which fallback label set to use for display/notes — the
 * real usage_addons branch already carries whatever label the talent typed,
 * and every list here shares identical keys/prices regardless of language. */
export function resolveRealAddons(socialLinks: unknown, lang: "ar" | "en" = "ar"): AddonItem[] {
  return parseUsageAddons(socialLinks) ?? (lang === "en" ? FALLBACK_ADDONS_EN : FALLBACK_ADDONS_AR);
}
