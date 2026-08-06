// ─── Section renderer registry ────────────────────────────────────────────────
// `profile_sections.render_component` is a KEY into this compile-time map, never
// executable content. An unknown key falls back to KeyValueListSection, so a bad
// config row degrades one section instead of white-screening a profile.
//
// Shared, not preview-specific: the admin preview and the future public profile
// renderer resolve through this same map.

import type { ComponentType } from "react";
import type { ProfileSectionDTO } from "@/features/profiles/types/dto";

import KeyValueListSection from "./sections/KeyValueListSection";
import TimelineSection from "./sections/TimelineSection";
import ChipListSection from "./sections/ChipListSection";
import CardGridSection from "./sections/CardGridSection";
import StatGridSection from "./sections/StatGridSection";
import CoreSectionPlaceholder from "./sections/CoreSectionPlaceholder";

export type DynamicLang = "ar" | "en";

export interface SectionRendererProps {
  section: ProfileSectionDTO;
  /**
   * Explicit rather than read from useSite(): the admin preview toggles
   * language independently of the operator's own UI language, and the public
   * renderer will pass useSite().lang.
   */
  lang: DynamicLang;
}

export type SectionRenderer = ComponentType<SectionRendererProps>;

/** Renderers for dynamic sections — these draw profile_values. */
const DYNAMIC_RENDERERS: Record<string, SectionRenderer> = {
  key_value_list: KeyValueListSection,
  timeline:       TimelineSection,
  chip_list:      ChipListSection,
  card_grid:      CardGridSection,
  stat_grid:      StatGridSection,
};

/**
 * PLACEHOLDER renderers for core sections.
 *
 * The registry has two distinct mappings:
 *
 *   dynamic sections → render_component → SECTION_RENDERERS (this file)
 *   core sections    → profile type     → adapters/ (CoreSectionAdapter)
 *
 * Core sections are backed by typed provider columns, not profile_values, so a
 * ProfileSectionDTO alone is not enough to draw them. The real components live
 * in app/(main)/talent/[handle]/_components/ and are reached through
 * adapters/renderCoreSection — never re-implemented here.
 *
 * These entries remain as the FALLBACK for when no adapter is supplied (the
 * admin preview) or when an adapter does not claim a key.
 */
const CORE_RENDERERS: Record<string, SectionRenderer> = {
  hero:         CoreSectionPlaceholder,
  about:        CoreSectionPlaceholder,
  portfolio:    CoreSectionPlaceholder,
  packages:     CoreSectionPlaceholder,
  social:       CoreSectionPlaceholder,
  availability: CoreSectionPlaceholder,
  usage_rights: CoreSectionPlaceholder,
  attributes:   CoreSectionPlaceholder,
  trust:        CoreSectionPlaceholder,
  payment:      CoreSectionPlaceholder,
};

export const SECTION_RENDERERS: Record<string, SectionRenderer> = {
  ...DYNAMIC_RENDERERS,
  ...CORE_RENDERERS,
};

export const FALLBACK_RENDERER: SectionRenderer = KeyValueListSection;

/** True when a renderer key exists in the registry. */
export function hasRenderer(key: string | null | undefined): boolean {
  return Boolean(key && key in SECTION_RENDERERS);
}

/** True when the key resolves to a placeholder rather than a real renderer. */
export function isCoreRenderer(key: string | null | undefined): boolean {
  return Boolean(key && key in CORE_RENDERERS);
}

/** Never throws — an unknown or missing key resolves to the fallback. */
export function resolveRenderer(key: string | null | undefined): SectionRenderer {
  if (!key) return FALLBACK_RENDERER;
  return SECTION_RENDERERS[key] ?? FALLBACK_RENDERER;
}
