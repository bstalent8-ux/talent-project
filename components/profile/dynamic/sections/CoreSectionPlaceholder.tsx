// ─── CoreSectionPlaceholder ───────────────────────────────────────────────────
// Core sections are backed by strongly typed columns (talent_profiles /
// brand_profiles) and carry no profile_values rows, so there is nothing for a
// dynamic renderer to draw.
//
// The real components for these keys — hero, portfolio, packages and the rest —
// already exist under app/(main)/talent/[handle]/_components/ and are wired to
// provider data. Phase 3 of the profile work maps them into the registry.
// Until then this placeholder keeps ordering and slot assignment verifiable
// without pretending to render provider-owned content.

import type { ProfileSectionDTO } from "@/features/profiles/types/dto";
import type { DynamicLang } from "../registry";

export default function CoreSectionPlaceholder({
  section,
  lang,
}: {
  section: ProfileSectionDTO;
  lang: DynamicLang;
}) {
  const note =
    lang === "ar"
      ? "قسم أساسي — يعرضه مزوّد الملف من أعمدة مُهيكلة."
      : "Core section — rendered by the profile provider from typed columns.";

  return (
    <div
      style={{
        border: "1px dashed var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        padding: "0.75rem",
        background: "var(--bg-card-muted)",
        color: "var(--text-muted)",
        fontSize: "var(--text-xs)",
      }}
    >
      {note}
      {section.renderComponent ? (
        <code style={{ marginInlineStart: "0.5rem" }}>{section.renderComponent}</code>
      ) : null}
    </div>
  );
}
