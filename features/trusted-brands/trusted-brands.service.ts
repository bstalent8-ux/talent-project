import { CACHE_SECONDS, CACHE_TAGS, cachedPublic } from "@/lib/cache";
import { adminClient } from "@/lib/supabase/admin";
import type { PublicTrustedBrand, TrustedBrand, TrustedBrandInput } from "./types";

function normalizeUrl(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeInput(input: TrustedBrandInput) {
  return {
    name:          input.name.trim(),
    logo_url:      normalizeUrl(input.logo_url),
    website_url:   normalizeUrl(input.website_url),
    display_order: Number.isFinite(input.display_order) ? Number(input.display_order) : 0,
    is_active:     input.is_active ?? true,
  };
}

export async function fetchPublicTrustedBrands(): Promise<PublicTrustedBrand[]> {
  const { data, error } = await adminClient
    .from("trusted_brands")
    .select("id, name, logo_url, website_url")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[trusted-brands] public fetch failed", error.message);
    return [];
  }

  return (data ?? []) as PublicTrustedBrand[];
}

export async function getCachedPublicTrustedBrands(): Promise<PublicTrustedBrand[]> {
  return cachedPublic(
    ["trusted-brands-public"],
    [CACHE_TAGS.trustedBrands.list],
    CACHE_SECONDS.oneHour,
    fetchPublicTrustedBrands,
  );
}

export async function fetchAdminTrustedBrands(): Promise<TrustedBrand[]> {
  const { data, error } = await adminClient
    .from("trusted_brands")
    .select("id, name, logo_url, website_url, display_order, is_active, created_at, updated_at")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as TrustedBrand[];
}

export async function createTrustedBrand(input: TrustedBrandInput): Promise<TrustedBrand> {
  const payload = normalizeInput(input);
  if (!payload.name) throw new Error("name required");

  const { data, error } = await adminClient
    .from("trusted_brands")
    .insert(payload)
    .select("id, name, logo_url, website_url, display_order, is_active, created_at, updated_at")
    .single();

  if (error) throw new Error(error.message);
  return data as TrustedBrand;
}

export async function updateTrustedBrand(id: string, input: TrustedBrandInput): Promise<TrustedBrand> {
  const payload = normalizeInput(input);
  if (!payload.name) throw new Error("name required");

  const { data, error } = await adminClient
    .from("trusted_brands")
    .update(payload)
    .eq("id", id)
    .select("id, name, logo_url, website_url, display_order, is_active, created_at, updated_at")
    .single();

  if (error) throw new Error(error.message);
  return data as TrustedBrand;
}

export async function setTrustedBrandActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await adminClient
    .from("trusted_brands")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function deleteTrustedBrand(id: string): Promise<void> {
  const { error } = await adminClient
    .from("trusted_brands")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function reorderTrustedBrands(ids: string[]): Promise<TrustedBrand[]> {
  const updates = await Promise.all(
    ids.map((id, index) => adminClient
      .from("trusted_brands")
      .update({ display_order: index })
      .eq("id", id)),
  );

  const failed = updates.find((result) => result.error);
  if (failed?.error) throw new Error(failed.error.message);

  return fetchAdminTrustedBrands();
}
