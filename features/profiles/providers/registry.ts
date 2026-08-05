import "server-only";

// ─── ProviderRegistry ─────────────────────────────────────────────────────────
// A frozen Map built from static imports. Not a DI container.
//
// Why static, not dynamic registration:
//   • Cloudflare Workers bundling cannot resolve `import(variable)`.
//   • A decorator/reflection container needs `reflect-metadata` and
//     `experimentalDecorators` — a heavyweight dependency, which CLAUDE.md
//     §15.7 forbids without a recorded decision.
//
// A static map is tree-shakeable, type-safe, zero runtime cost, and satisfies
// Open/Closed on the one axis that matters: adding a profile type touches
// exactly one existing file — this one.

import { ProfileError } from "../errors/profile-error";
import { brandProvider } from "./brand.provider";
import { talentProvider } from "./talent.provider";
import type { BookableProvider, ProfileProvider } from "../types/provider";

// ── Phase 5: adding AgencyProvider is +1 import and +1 array entry. ──────────
// import { agencyProvider } from "./agency.provider";

const PROVIDERS: readonly ProfileProvider<any, any, any>[] = [
  talentProvider,
  brandProvider,
  // agencyProvider,
];

const BY_SLUG: ReadonlyMap<string, ProfileProvider<any, any, any>> = new Map(
  PROVIDERS.map((p) => [p.meta.typeSlug, p]),
);

/** Every registered provider, in registration order. */
export function listProviders(): readonly ProfileProvider<any, any, any>[] {
  return PROVIDERS;
}

export function hasProvider(typeSlug: string): boolean {
  return BY_SLUG.has(typeSlug);
}

/** Throws INVALID_PROFILE_TYPE (500 internally, "not found" publicly). */
export function resolve(typeSlug: string): ProfileProvider<any, any, any> {
  const provider = BY_SLUG.get(typeSlug);
  if (!provider) throw ProfileError.invalidProfileType(typeSlug);
  return provider;
}

/**
 * Resolves a provider that is statically known to accept bookings.
 * Throws NOT_BOOKABLE for a registered but non-bookable type (e.g. brand).
 */
export function resolveBookable(typeSlug: string): BookableProvider {
  const provider = resolve(typeSlug);
  if (!provider.meta.bookable || typeof provider.resolveBookingTarget !== "function") {
    throw ProfileError.notBookable(typeSlug);
  }
  return provider as BookableProvider;
}

export const providerRegistry = { listProviders, hasProvider, resolve, resolveBookable };

export type ProviderRegistry = typeof providerRegistry;
