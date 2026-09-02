export const runtime = 'edge';

// ─── Public brand profile ─────────────────────────────────────────────────────
// Reads ONE DTO from ProfileService and hands it to the layout-driven shell.
//
// Replaces a hand-rolled `profiles` query with a three-attempt column fallback
// (it retried on PostgREST 42703 to survive columns that may not exist). The
// provider reads brand_profiles through a typed repository, so that guesswork
// is gone — but the same route still accepts a UUID or a handle, because links
// to /brand/<uuid> exist in the wild.
//
// The public gate now lives in BrandProvider (brand_profiles.status), reconciled
// with the legacy profiles.brand_status flag by migration 20260809. Without that
// backfill every approved brand would 404 here.

import { notFound } from "next/navigation";
import { CACHE_SECONDS, CACHE_TAGS, cachedPublic } from "@/lib/cache";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ProfileError, profileService } from "@/features/profiles";
import type { PublicProfileDTO } from "@/features/profiles/types/dto";
import BrandProfileShell from "./_components/BrandProfileShell";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** NOT_FOUND is a legitimate outcome and is cached; anything else must not be. */
async function loadBrand(id: string): Promise<PublicProfileDTO | null> {
  try {
    return UUID_RE.test(id)
      ? await profileService.getPublicProfileById(id)
      : await profileService.getPublicProfileByHandle(id);
  } catch (e) {
    const error = ProfileError.from(e);
    if (error.status === 404) return null;
    throw error;
  }
}

/**
 * The public gate hid this id/handle. Check whether the current signed-in
 * visitor is an admin — if so, they get the same read-only preview an admin
 * gets of a not-yet-approved (or suspended/blocked) talent listing, so the
 * "View" icon in /admin/brands works on every row, not just approved+active
 * ones. Never runs for anyone whose role isn't "admin" in `profiles` (RLS
 * only allows reading one's own row here, so this can't be used to probe
 * another visitor's role). Mirrors getAdminPreviewIfAllowed in
 * app/(main)/_lib/load-talent-profile.ts.
 */
async function getAdminPreviewIfAllowed(id: string): Promise<PublicProfileDTO | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: viewer } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (viewer?.role !== "admin") return null;

    const { profile } = UUID_RE.test(id)
      ? await profileService.getAdminPreviewProfileById(id)
      : await profileService.getAdminPreviewProfileByHandle(id);
    if (profile.meta.typeSlug !== "brand") return null;

    return profile;
  } catch {
    return null;
  }
}

export default async function BrandDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Reject anything that is neither a UUID nor a plausible handle before it
  // reaches a query.
  if (!UUID_RE.test(id) && !/^[a-z0-9-]{1,80}$/i.test(id)) notFound();

  const payload = await cachedPublic(
    ["brand-detail", id],
    [CACHE_TAGS.brands.detail(id), CACHE_TAGS.brands.list],
    CACHE_SECONDS.tenMinutes,
    async () => {
      const profile = await loadBrand(id);
      if (!profile) return null;
      if (profile.meta.typeSlug !== "brand") return null;

      // Collaboration count is a booking fact, not a profile one, so it is not
      // in the DTO. Read after the profile so an unapproved brand costs one
      // query instead of two.
      const { data: bookings } = await adminClient
        .from("bookings")
        .select("id")
        .eq("brand_id", profile.identity.id)
        .eq("status", "completed");

      return { profile, completedBookings: bookings?.length ?? 0 };
    },
  );

  if (!payload) {
    // Never cached (per-viewer, admin-only) — deliberately outside cachedPublic.
    const adminProfile = await getAdminPreviewIfAllowed(id);
    if (!adminProfile) notFound();

    const { data: bookings } = await adminClient
      .from("bookings")
      .select("id")
      .eq("brand_id", adminProfile.identity.id)
      .eq("status", "completed");

    return (
      <BrandProfileShell
        completedBookings={bookings?.length ?? 0}
        profile={adminProfile}
      />
    );
  }

  return (
    <BrandProfileShell
      completedBookings={payload.completedBookings}
      profile={payload.profile}
    />
  );
}
