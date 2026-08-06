export const runtime = "edge";
export const dynamic = "force-dynamic";

// ─── Dynamic Profile Runtime test page ────────────────────────────────────────
// /admin/profile-config/types/[id]/runtime?handle=<profile handle>
//
// Renders a REAL profile DTO through DynamicProfileRenderer — the exact path
// planned for production. Unlike /preview (mock values, no core components),
// this exercises ProfileService, the adapters and the existing components end
// to end.
//
// DEVELOPMENT ONLY. Returns 404 in production: it renders real user data
// through an unshipped code path, which does not belong on a production
// surface even behind the admin gate.
//
// /talent/[handle] is NOT modified. This route is additive.

import { notFound } from "next/navigation";
import { profileConfigService } from "@/features/profiles/services/profile-config.service";
import { profileService } from "@/features/profiles";
import type { PublicProfileDTO } from "@/features/profiles/types/dto";
import RuntimeTestClient from "./_components/RuntimeTestClient";

export default async function DynamicRuntimeTestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ handle?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const { id } = await params;
  const { handle } = await searchParams;

  let type;
  try {
    type = await profileConfigService.getType(id);
  } catch {
    notFound();
  }

  let profile: PublicProfileDTO | null = null;
  let loadError: string | null = null;

  if (handle) {
    try {
      profile = await profileService.getPublicProfileByHandle(handle);
    } catch (error) {
      // Surfaced in the UI rather than thrown: a missing or unapproved handle
      // is the normal case while testing.
      loadError = error instanceof Error ? error.message : "not found";
    }
  }

  return (
    <RuntimeTestClient
      handle={handle ?? ""}
      loadError={loadError}
      profile={profile}
      profileTypeId={id}
      typeSlug={type.slug}
    />
  );
}
