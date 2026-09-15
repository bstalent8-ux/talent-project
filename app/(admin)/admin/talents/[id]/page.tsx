export const runtime = 'edge';

export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { adminClient } from "@/lib/supabase/admin";
import { fetchTalentActions } from "@/features/admin/services/admin.service";
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
      id, full_name, handle, city, phone_number, created_at, avatar_url,
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
        id, full_name, handle, city, phone_number, created_at, avatar_url,
        talent_profiles!inner (
          id, category, bio, specialties, availability, packages, social_links
        )
      `)
      .eq("talent_profiles.id", id)
      .single());
  }

  if (!data) notFound();

  // Email lives in auth.users, not profiles — a separate lookup, admin-only,
  // never exposed on any public/self-serve route.
  const [{ data: authUser }, initialActions] = await Promise.all([
    adminClient.auth.admin.getUserById(data.id),
    fetchTalentActions(id),
  ]);

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
        packages:     (tp?.packages ?? []) as unknown[],
        social_links: (tp?.social_links ?? {}) as Record<string, unknown>,
        model_metrics: (tpRecord.model_metrics ?? {}) as Record<string, unknown>,
      }}
      identity={{
        avatarUrl: data.avatar_url ?? null,
        fullName:  data.full_name ?? null,
        phone:     data.phone_number ?? null,
        category:  tp?.category ?? null,
      }}
      registration={{
        email:     authUser?.user?.email ?? null,
        phone:     data.phone_number ?? null,
        createdAt: data.created_at ?? null,
      }}
      initialActions={initialActions}
    />
  );
}