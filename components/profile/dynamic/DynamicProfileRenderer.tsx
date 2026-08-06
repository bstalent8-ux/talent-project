"use client";

// ─── DynamicProfileRenderer ───────────────────────────────────────────────────
// The production entry point: DTO in, rendered profile out.
//
//   DynamicProfileProvider   (shared state: lang, selectedPackage, booking)
//        └─ DynamicProfileSections   (layout slots, ordering, anchors)
//             ├─ core sections    → renderCoreSection → existing components
//             └─ dynamic sections → registry renderers
//
// This is the SAME path the public route will use. The admin runtime test page
// renders through this component, not through a preview-only copy.
//
// It is the only module that imports both the adapters and the slot walker, so
// it is also the only one that pulls the talent component tree into a bundle.

import { DynamicProfileProvider, useDynamicProfile, type BookingActions } from "./DynamicProfileContext";
import { DynamicProfileSections, type CoreRenderBridge } from "./DynamicSectionRenderer";
import { renderCoreSection } from "./adapters";
import type { PublicProfileDTO } from "@/features/profiles/types/dto";
import type { DynamicLang } from "./registry";

/** Reads the context and hands the slot walker a ready core bridge. */
function DynamicProfileBody() {
  const { profile, lang, typeSlug, adapterContext } = useDynamicProfile();

  const core: CoreRenderBridge<never> | undefined = adapterContext
    ? ({
        context: adapterContext,
        render:  renderCoreSection,
      } as unknown as CoreRenderBridge<never>)
    : undefined;

  return (
    <DynamicProfileSections
      core={core}
      lang={lang}
      layout={profile.layout ?? null}
      profile={profile}
      sections={profile.sections}
      typeSlug={typeSlug}
    />
  );
}

export default function DynamicProfileRenderer({
  profile,
  lang,
  booking,
}: {
  profile:  PublicProfileDTO;
  lang:     DynamicLang;
  booking?: BookingActions;
}) {
  return (
    <DynamicProfileProvider booking={booking} lang={lang} profile={profile}>
      <DynamicProfileBody />
    </DynamicProfileProvider>
  );
}

export { DynamicProfileProvider, useDynamicProfile };
