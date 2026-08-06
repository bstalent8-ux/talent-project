// ─── Core adapter registry ────────────────────────────────────────────────────
// Per-profile-type adapter map, mirroring the provider registry pattern:
// static imports into a frozen Map, resolvable without I/O.
//
// Adding a profile type's core adapter is +1 import and +1 entry. Nothing else
// in the renderer changes.

import type { ReactNode } from "react";
import type { ProfileSectionDTO } from "@/features/profiles/types/dto";
import { talentCoreSectionAdapter } from "./talent.adapter";
import { brandCoreSectionAdapter } from "./brand.adapter";
import type {
  CoreSectionAdapter,
  CoreSectionRenderPlan,
  ProfileContext,
} from "./types";

const ADAPTERS: ReadonlyMap<string, CoreSectionAdapter<never>> = new Map([
  ["talent", talentCoreSectionAdapter as unknown as CoreSectionAdapter<never>],
  ["brand",  brandCoreSectionAdapter  as unknown as CoreSectionAdapter<never>],
]);

/** Null for an unregistered profile type — never throws. */
export function getCoreAdapter(typeSlug: string): CoreSectionAdapter<never> | null {
  return ADAPTERS.get(typeSlug) ?? null;
}

export function listCoreAdapters(): CoreSectionAdapter<never>[] {
  return [...ADAPTERS.values()];
}

/** Section keys the adapter for this profile type can render. */
export function supportedCoreKeys(typeSlug: string): readonly string[] {
  return getCoreAdapter(typeSlug)?.supportedKeys ?? [];
}

/**
 * Pure props resolution. Null when the type has no adapter, or the adapter does
 * not claim this section key.
 */
export function buildCoreSectionProps(
  sectionKey: string,
  context: ProfileContext,
): CoreSectionRenderPlan | null {
  const adapter = getCoreAdapter(context.typeSlug);
  if (!adapter) return null;
  return adapter.buildProps(sectionKey, context as never);
}

/**
 * The entry point the dynamic renderer calls.
 *
 * Fails safe in every branch: unknown profile type, unclaimed section key, or a
 * throwing adapter all return null, and the renderer falls back to
 * CoreSectionPlaceholder. A core section can never crash a profile page.
 */
export function renderCoreSection(
  section: ProfileSectionDTO,
  context: ProfileContext,
): ReactNode | null {
  const adapter = getCoreAdapter(context.typeSlug);
  if (!adapter) return null;
  if (!adapter.supports(section.key)) return null;

  try {
    return adapter.render(section, context as never);
  } catch (error) {
    console.error("[profile/core-adapter] render failed", section.key, error);
    return null;
  }
}

export { talentCoreSectionAdapter, brandCoreSectionAdapter };
export * from "./types";
