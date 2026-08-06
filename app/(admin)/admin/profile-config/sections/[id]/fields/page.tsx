export const runtime = "edge";
export const dynamic = "force-dynamic";

// /admin/profile-config/sections/[id]/fields
// Admin role enforced by app/(admin)/layout.tsx.

import { notFound } from "next/navigation";
import { profileConfigService } from "@/features/profiles/services/profile-config.service";
import FieldsClient from "./_components/FieldsClient";

export default async function SectionFieldsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let context;
  try {
    context = await profileConfigService.getSectionWithType(id);
  } catch {
    notFound();
  }

  const fields = await profileConfigService.listFieldsWithUsage(id);

  return (
    <FieldsClient
      initialFields={fields}
      profileType={context.type}
      section={context.section}
    />
  );
}
