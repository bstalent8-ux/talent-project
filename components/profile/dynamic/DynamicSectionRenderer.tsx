"use client";

// ─── DynamicSectionRenderer / DynamicProfileSections ──────────────────────────
// The layout-slot walker. Given sections, a layout and a language, it renders
// each slot in configured order.
//
// Shared with the future public profile renderer — the admin preview only
// supplies a mock DTO to this same component.

import type { ReactNode } from "react";
import type { ProfileLayoutDTO, ProfileSectionDTO, PublicProfileDTO } from "@/features/profiles/types/dto";
import { hasSectionContent } from "@/features/profiles/content/section-content";
import { useIsMobile } from "@/hooks/useIsMobile";
import { resolveRenderer, type DynamicLang } from "./registry";
import { anchorIdFor } from "./anchors";
import { isInlineCoreKey } from "./adapters/core-keys";

/**
 * Core-section renderer, supplied by the caller.
 *
 * Injected rather than imported so that importing this module does NOT pull the
 * talent component tree (framer-motion, DirectBriefModal, ProtectedAction…)
 * into every bundle. The admin preview renders no core components and passes
 * nothing; the public renderer will pass `renderCoreSection` from
 * ./adapters together with a ProfileContext.
 */
export interface CoreRenderBridge<TContext = unknown> {
  context:  TContext;
  /** Returns null when the section is unsupported — then the placeholder shows. */
  render:   (section: ProfileSectionDTO, context: TContext) => ReactNode | null;
}

export function DynamicSectionRenderer({
  section,
  lang,
  core,
  typeSlug,
  profile,
}: {
  section: ProfileSectionDTO;
  lang: DynamicLang;
  core?: CoreRenderBridge<never>;
  /** Enables inline-core detection. Without it every core section renders. */
  typeSlug?: string;
  /**
   * Enables the empty-section guard. ProfileService has already filtered these
   * out, so this is defence in depth for callers that assemble a DTO by hand.
   * Omitted by the admin preview, which must show every configured section
   * regardless of whether the mock profile fills it.
   */
  profile?: PublicProfileDTO;
}) {
  const anchorId = anchorIdFor(section.key);

  // Nothing to show → render nothing at all. Not an "empty" card, not a
  // heading with a placeholder underneath: the section disappears and the
  // profile shrinks around it.
  if (profile && typeSlug && !hasSectionContent(typeSlug, section, profile)) {
    return null;
  }

  // Intentionally inline core sections render nothing standalone — their data
  // lives inside another component (mostly ProfileHero) or is completion-only.
  // An empty anchor div is still emitted so TabsNavigation can scroll to it,
  // matching TalentModelProfile.tsx:97 (`<div id="section-about" />`).
  if (section.kind === "core" && typeSlug && isInlineCoreKey(typeSlug, section.key)) {
    return <div id={anchorId} />;
  }

  // Core sections are backed by typed provider columns, so they render through
  // an adapter rather than through the dynamic renderer registry.
  if (section.kind === "core" && core) {
    let node: ReactNode | null = null;
    try {
      node = core.render(section, core.context);
    } catch (error) {
      console.error("[profile/dynamic] core section render failed", section.key, error);
      node = null;
    }
    // A core component owns its own chrome (heading, card, spacing), so it is
    // wrapped only in the anchor div — exactly how TalentModelProfile does it.
    if (node) return <div id={anchorId}>{node}</div>;
  }

  const Renderer = resolveRenderer(section.renderComponent);

  return (
    <section
      id={anchorId}
      style={{
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        padding: "1rem",
        background: "var(--bg-card)",
      }}
    >
      <h3
        style={{
          margin: "0 0 0.15rem",
          color: "var(--text-primary)",
          fontSize: "var(--text-lg)",
          fontWeight: 900,
        }}
      >
        {section.title[lang]}
      </h3>
      {section.description ? (
        <p style={{ margin: "0 0 0.75rem", color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
          {section.description[lang]}
        </p>
      ) : (
        <div style={{ height: "0.75rem" }} />
      )}

      <Renderer lang={lang} section={section} />
    </section>
  );
}

/**
 * Walks the layout slots.
 *
 * A layout key that matches no section is SKIPPED rather than throwing — the
 * same tolerance the migration comment describes. The admin preview surfaces
 * those keys as diagnostics so they are visible rather than silently dropped.
 *
 * When no layout is configured, sections fall back to displayOrder.
 */
export function DynamicProfileSections({
  sections,
  layout,
  lang,
  core,
  typeSlug,
  profile,
  sidebarFooter,
  mainFooter,
}: {
  sections:  ProfileSectionDTO[];
  layout:    ProfileLayoutDTO | null;
  lang:      DynamicLang;
  core?:     CoreRenderBridge<never>;
  typeSlug?: string;
  /** When supplied, empty sections are dropped before the slots are laid out. */
  profile?:  PublicProfileDTO;
  /**
   * Fixed chrome pinned below the sidebar slots — the booking CTA and the
   * ask-a-question card. Not sections: they are always available and are not
   * driven by profile data, so they must survive an otherwise empty sidebar.
   */
  sidebarFooter?: ReactNode;
  /** Same, for the main column (e.g. a closing call to action). */
  mainFooter?: ReactNode;
}) {
  const isMobile = useIsMobile();

  // Emptiness is resolved BEFORE slotting, not inside each slot: a sidebar whose
  // every section is empty must collapse the grid back to one column, which is
  // impossible to decide once the aside has already been rendered.
  const visible = profile && typeSlug
    ? sections.filter((section) => hasSectionContent(typeSlug, section, profile))
    : sections;

  const byKey = Object.fromEntries(visible.map((section) => [section.key, section]));

  const hasLayout = Boolean(layout && (layout.main.length > 0 || layout.sidebar.length > 0));

  const main = hasLayout
    ? layout!.main.map((key) => byKey[key]).filter(Boolean)
    : [...visible].sort((a, b) => a.displayOrder - b.displayOrder);

  const sidebar = hasLayout
    ? layout!.sidebar.map((key) => byKey[key]).filter(Boolean)
    : [];

  // Chrome keeps the sidebar alive on a profile whose sidebar sections are all
  // empty — otherwise a brand new talent loses the booking CTA entirely.
  const showSidebar = sidebar.length > 0 || Boolean(sidebarFooter);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: showSidebar && !isMobile ? "minmax(0, 1fr) minmax(240px, 0.42fr)" : "1fr",
        gap: "1rem",
        alignItems: "start",
      }}
    >
      <div style={{ display: "grid", gap: "1rem" }}>
        {main.map((section) => (
          <DynamicSectionRenderer core={core} key={section.key} lang={lang} profile={profile} section={section} typeSlug={typeSlug} />
        ))}
        {mainFooter}
      </div>

      {showSidebar ? (
        <aside style={{ display: "grid", gap: "1rem" }}>
          {sidebar.map((section) => (
            <DynamicSectionRenderer core={core} key={section.key} lang={lang} profile={profile} section={section} typeSlug={typeSlug} />
          ))}
          {sidebarFooter}
        </aside>
      ) : null}
    </div>
  );
}

export default DynamicProfileSections;
