// ─── Shared talent-profile loader ─────────────────────────────────────────────
// Used by all three public talent routes — /talent/[handle] (generic
// categories), /model/[handle], /ugc/[handle] — so the public gate, the
// owner-preview fallback, and the cache tag are defined exactly once. A
// forgotten filter here is a data leak (CLAUDE.md §8); do not duplicate this
// logic into a route folder again.

import type { Metadata } from "next";
import { CACHE_SECONDS, CACHE_TAGS, cachedPublic } from "@/lib/cache";
import { cdnImage } from "@/lib/images";
import { redactEmails } from "@/lib/public-display-name";
import { createClient } from "@/lib/supabase/server";
import { ProfileError, profileService } from "@/features/profiles";
import type { PublicProfileDTO, TalentPublicCore } from "@/features/profiles/types/dto";
import type { ModerationStatus } from "@/features/profiles/types/raw";

import { canonicalTalentPath } from "@/lib/talent-profile-route";
export { canonicalTalentPath };

export interface LoadedTalentProfile {
  profile: PublicProfileDTO;
  /** True when this is the signed-in owner's own read-only preview of a
   * not-yet-approved listing — never a real public view. */
  isOwnerPreview: boolean;
  /** True when an admin is previewing someone else's not-yet-approved
   * listing (e.g. from /admin/talents' View icon) before approving it. */
  isAdminPreview: boolean;
  moderationStatus: ModerationStatus | null;
}

/**
 * The public gate hid this handle. Before returning nothing, check whether
 * the CURRENT signed-in visitor is the handle's own owner — if so, they get
 * the full read-only preview of their own not-yet-approved listing.
 *
 * Never runs the ungated preview lookup for anyone but a session whose own
 * handle matches the route param, so it cannot be used to probe another
 * profile's moderation status or content. Every other visitor (no session,
 * or a session that owns a different handle) still gets null — this NEVER
 * makes a pending profile public.
 */
async function getOwnerPreviewIfMatches(
  handle: string,
): Promise<{ profile: PublicProfileDTO; moderationStatus: ModerationStatus | null } | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { profile, moderationStatus } = await profileService.getOwnerPreviewProfile(user.id);
    if (profile.meta.typeSlug !== "talent") return null;
    if ((profile.identity.handle ?? "").toLowerCase() !== handle.toLowerCase()) return null;

    return { profile, moderationStatus };
  } catch {
    return null;
  }
}

/**
 * The public gate hid this handle. Check whether the current signed-in
 * visitor is an admin — if so, they get the same read-only preview an owner
 * gets of their own not-yet-approved listing, so the admin can review a
 * profile before deciding to approve it. Never runs for anyone whose role
 * isn't "admin" in `profiles` (RLS only allows reading one's own row here,
 * so this can't be used to probe another visitor's role).
 */
async function getAdminPreviewIfAllowed(
  handle: string,
): Promise<{ profile: PublicProfileDTO; moderationStatus: ModerationStatus | null } | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: viewer } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (viewer?.role !== "admin") return null;

    const { profile, moderationStatus } = await profileService.getAdminPreviewProfileByHandle(handle);
    if (profile.meta.typeSlug !== "talent") return null;

    return { profile, moderationStatus };
  } catch {
    return null;
  }
}

/** Fetches the public profile for `handle`, falling back to the owner's own
 * pending-listing preview, then an admin's review preview. Returns null when
 * none apply (real 404). */
export async function loadTalentProfile(handle: string): Promise<LoadedTalentProfile | null> {
  const profile = await cachedPublic<PublicProfileDTO | null>(
    // "v2" busts every previously-cached entry under this key shape — the
    // findBrands() column bug (see talent.repository.ts) made this loader
    // throw on every talent profile view for a few hours; the cache key
    // needs to change once so no stale poisoned entry can still be served
    // for a handle visited during that window. Safe to drop once confirmed
    // no longer needed, or bump again if this ever recurs.
    ["talent-detail", "v2", handle],
    [CACHE_TAGS.talents.detail(handle), CACHE_TAGS.talents.list],
    CACHE_SECONDS.tenMinutes,
    async () => {
      try {
        return await profileService.getPublicProfileByHandle(handle);
      } catch (e) {
        const error = ProfileError.from(e);
        // NOT_FOUND covers a missing handle, a blocked account and a talent
        // whose listing is not approved — deliberately the same outcome, so
        // the page cannot be used to probe moderation status. Anything else
        // is a real failure and must not be cached as a 404.
        if (error.status === 404) return null;
        throw error;
      }
    },
  );

  if (profile) {
    // A brand handle must not render through any talent shell.
    if (profile.meta.typeSlug !== "talent") return null;
    return { profile, isOwnerPreview: false, isAdminPreview: false, moderationStatus: null };
  }

  const owner = await getOwnerPreviewIfMatches(handle);
  if (owner) {
    return { profile: owner.profile, isOwnerPreview: true, isAdminPreview: false, moderationStatus: owner.moderationStatus };
  }

  const adminPreview = await getAdminPreviewIfAllowed(handle);
  if (adminPreview) {
    return { profile: adminPreview.profile, isOwnerPreview: false, isAdminPreview: true, moderationStatus: adminPreview.moderationStatus };
  }

  return null;
}

export function talentCategory(profile: PublicProfileDTO): string | null {
  return (profile.core as TalentPublicCore).category;
}

const CATEGORY_LABEL: Record<string, string> = {
  ugc: "UGC Creator",
  model: "Model",
  fashion: "Model",
};

/**
 * Real <title>/description/og tags for a talent profile page, shared by
 * /ugc, /model and /talent. Without this every profile inherited the root
 * layout's generic title and `og:url` (the homepage), so a shared profile link
 * previewed as the homepage. Preview (owner/admin) renders are never indexed.
 */
export async function buildTalentMetadata(handle: string): Promise<Metadata> {
  const loaded = await loadTalentProfile(handle);
  if (!loaded) return { title: "Talent not found | Talents", robots: { index: false, follow: false } };

  const { profile } = loaded;
  const name = profile.identity.fullName?.trim() || profile.identity.handle || handle;
  const category = talentCategory(profile);
  const roleLabel = (category && CATEGORY_LABEL[category]) || "Talent";
  const city = profile.identity.city?.trim();

  const title = `${name} — ${roleLabel}${city ? ` in ${city}` : ""} | Talents`;
  const bio = redactEmails(profile.identity.bio);
  const description = bio
    ? (bio.length > 155 ? `${bio.slice(0, 152).trimEnd()}…` : bio)
    : `View ${name}'s portfolio, packages and reviews on Talents, and book directly.`;

  const path = canonicalTalentPath(category, profile.identity.handle ?? handle);
  const image = profile.identity.avatarUrl ? cdnImage(profile.identity.avatarUrl, 1200, "limit") : null;
  const isPreview = loaded.isOwnerPreview || loaded.isAdminPreview;

  return {
    title,
    description,
    alternates: { canonical: path },
    robots: isPreview ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      url: path,
      siteName: "Talents",
      type: "profile",
      ...(image ? { images: [{ url: image, alt: name }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}
