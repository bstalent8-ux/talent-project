export const runtime = 'edge';

export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getCachedUser } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { profileService } from "@/features/profiles";
import { fetchCategories } from "@/features/categories/services/category.service";
import SettingsClient from "./_components/SettingsClient";

export default async function SettingsPage() {
  const user = await getCachedUser();
  if (!user) redirect("/login");

  const { data: profile } = await adminClient
    .from("profiles")
    .select(`
      id, role, full_name, handle, city, bio, avatar_url, phone_number, brand_status,
      brand_category, tax_document_url, brand_verification_photos, brand_rejection_reason
    `)
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/login");

  // Only a brand needs the live category list — skip the read otherwise.
  const brandCategories = profile.role === "brand" ? await fetchCategories("brand") : [];

  let talentStatus: string | null = null;
  let talentCategory: string | null = null;
  if (profile.role === "talent") {
    const ref = await profileService.resolveProviderRefSafe(user.id, "talent");
    if (ref) {
      const { data: tp } = await adminClient
        .from("talent_profiles")
        .select("status, category")
        .eq("id", ref.providerProfileId)
        .maybeSingle();
      talentStatus = tp?.status ?? null;
      talentCategory = tp?.category ?? null;
    }
  }

  return (
    <SettingsClient
      profile={profile}
      email={user.email ?? null}
      talentStatus={talentStatus}
      talentCategory={talentCategory}
      brandCategories={brandCategories}
    />
  );
}
