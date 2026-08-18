export const runtime = 'edge';

export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { adminClient } from "@/lib/supabase/admin";
import TalentEditorClient from "./_components/TalentEditorClient";

export default async function AdminTalentEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // model_metrics ships in a human-applied SQL-editor migration (CLAUDE.md
  // §6, supabase/migrations/20260820_talent_model_metrics.sql) — tolerate it
  // not existing yet rather than 500ing this whole editor page.
  let { data, error } = await adminClient
    .from("profiles")
    .select(`
      id, full_name, handle, city,
      talent_profiles!inner (
        id, category, bio, specialties, availability, packages, social_links, model_metrics
      )
    `)
    .eq("talent_profiles.id", id)
    .single();

  if (error && (error.code === "42703" || error.code === "PGRST204") && error.message?.includes("model_metrics")) {
    ({ data, error } = await adminClient
      .from("profiles")
      .select(`
        id, full_name, handle, city,
        talent_profiles!inner (
          id, category, bio, specialties, availability, packages, social_links
        )
      `)
      .eq("talent_profiles.id", id)
      .single());
  }

  if (!data) notFound();

  const tp = Array.isArray(data.talent_profiles)
    ? data.talent_profiles[0]
    : data.talent_profiles;
  const tpRecord = (tp ?? {}) as Record<string, unknown>;

  return (
    <TalentEditorClient
      talentProfileId={id}
      profileUserId={data.id}
      initialData={{
        full_name:    data.full_name ?? "",
        handle:       data.handle ?? "",
        city:         data.city ?? "",
        category:     tp?.category ?? "",
        bio:          tp?.bio ?? "",
        specialties:  (tp?.specialties ?? []).join(", "),
        availability: tp?.availability ?? "available",
        packages:     JSON.stringify(tp?.packages ?? [], null, 2),
        social_links: JSON.stringify(tp?.social_links ?? {}, null, 2),
        model_metrics: (tpRecord.model_metrics ?? {}) as Record<string, unknown>,
      }}
    />
  );
}