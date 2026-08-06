export const runtime = "edge";
export const dynamic = "force-dynamic";

// /admin/profile-config/types/[id]/preview?variant=public
//
// Server-generated preview. Reads configuration tables only — never
// profile_values, never a real user profile.
//
// Admin role enforced by app/(admin)/layout.tsx.

import { notFound } from "next/navigation";
import { profileConfigService } from "@/features/profiles/services/profile-config.service";
import { previewService } from "@/features/profiles/services/preview.service";
import { LAYOUT_VARIANTS, type LayoutVariant } from "@/features/profiles/validation/config-schemas";
import PreviewClient from "./_components/PreviewClient";

export default async function ProfileTypePreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ variant?: string }>;
}) {
  const { id } = await params;
  const { variant: rawVariant } = await searchParams;

  const variant: LayoutVariant = LAYOUT_VARIANTS.includes(rawVariant as LayoutVariant)
    ? (rawVariant as LayoutVariant)
    : "public";

  let preview;
  try {
    preview = await previewService.build(id, variant);
  } catch {
    notFound();
  }

  // Type switcher options. Inactive types stay listed — previewing one before
  // activation is the point.
  const allTypes = await profileConfigService.listTypes();

  return (
    <PreviewClient
      diagnostics={preview.diagnostics}
      layout={preview.layout}
      profileTypeId={id}
      sections={preview.sections}
      types={allTypes.map((type) => ({
        id:      type.id,
        slug:    type.slug,
        name_ar: type.name_ar,
        name_en: type.name_en,
        name:    type.name,
      }))}
      variant={variant}
    />
  );
}
