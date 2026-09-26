export const runtime = 'edge';

// ─── /profile/brand-setup ─────────────────────────────────────────────────────
// The brand profile wizard: logo + cover, basics, about, links, done. First
// stop after the brand onboarding tour, and the "Edit page" target from the
// public brand page / settings. Brand accounts only (middleware already sends
// guests to /login for /profile/*).

import { redirect } from "next/navigation";
import { getCachedUser } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { fetchCategories } from "@/features/categories/services/category.service";
import BrandSetupWizard, { type BrandSetupInitial } from "./_components/BrandSetupWizard";

export const metadata = { title: "Brand page setup | Talents" };

export default async function BrandSetupPage() {
  const user = await getCachedUser();
  if (!user) redirect("/login?next=/profile/brand-setup");

  const { data: profile } = await adminClient
    .from("profiles")
    .select("role, handle, full_name, avatar_url, city, bio")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "brand") redirect("/profile/me");

  const [{ data: core }, extrasRes, categories] = await Promise.all([
    adminClient.from("brand_profiles")
      .select("company_name, category_id, industry, website_url, social_links")
      .eq("user_id", user.id).maybeSingle(),
    adminClient.from("brand_profiles")
      .select("cover_url, tagline, company_size, founded_year, tags")
      .eq("user_id", user.id).maybeSingle(),
    fetchCategories("brand"),
  ]);

  // A missing column means 20260926_brand_public_page.sql isn't applied yet —
  // the wizard still runs, it just tells the brand those fields can't save.
  const extras = extrasRes.error ? null : extrasRes.data;
  const social = (core?.social_links ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : "");

  const initial: BrandSetupInitial = {
    userId:      user.id,
    handle:      profile.handle ?? null,
    name:        core?.company_name || profile.full_name || "",
    avatarUrl:   profile.avatar_url ?? null,
    city:        profile.city ?? "",
    bio:         profile.bio ?? "",
    categoryId:  core?.category_id ?? "",
    industry:    core?.industry ?? "",
    website:     core?.website_url ?? "",
    social: {
      instagram: str(social.instagram), tiktok: str(social.tiktok), youtube: str(social.youtube),
      facebook: str(social.facebook), linkedin: str(social.linkedin), x: str(social.x),
    },
    coverUrl:    extras?.cover_url ?? null,
    tagline:     extras?.tagline ?? "",
    companySize: extras?.company_size ?? "",
    foundedYear: extras?.founded_year ? String(extras.founded_year) : "",
    tags:        Array.isArray(extras?.tags) ? extras.tags : [],
    extrasReady: !extrasRes.error,
  };

  return (
    <BrandSetupWizard
      initial={initial}
      categories={categories.map((c) => ({ id: c.id, ar: c.label_ar, en: c.label_en }))}
    />
  );
}
