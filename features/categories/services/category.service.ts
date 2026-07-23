import { adminClient } from "@/lib/supabase/admin";
import type { CategoryRoleType, CategoryUpsertInput, MarketplaceCategory } from "../types";

export const fallbackCategories: MarketplaceCategory[] = [
  { id: "ugc", role_type: "talent", label_ar: "UGC Creator", label_en: "UGC Creator", description: null, is_active: true, sort_order: 10 },
  { id: "influencer", role_type: "talent", label_ar: "Influencer", label_en: "Influencer", description: null, is_active: true, sort_order: 20 },
  { id: "fashion", role_type: "talent", label_ar: "Fashion", label_en: "Fashion", description: null, is_active: true, sort_order: 30 },
  { id: "food_reviewer", role_type: "talent", label_ar: "Food Reviewer", label_en: "Food Reviewer", description: null, is_active: true, sort_order: 40 },
  { id: "tech_reviewer", role_type: "talent", label_ar: "Tech Reviewer", label_en: "Tech Reviewer", description: null, is_active: true, sort_order: 50 },
  { id: "unboxing", role_type: "talent", label_ar: "Unboxing", label_en: "Unboxing", description: null, is_active: true, sort_order: 60 },
  { id: "host", role_type: "talent", label_ar: "Host", label_en: "Host", description: null, is_active: true, sort_order: 70 },
  { id: "restaurant", role_type: "brand", label_ar: "Restaurant", label_en: "Restaurant", description: null, is_active: true, sort_order: 110 },
  { id: "cafe", role_type: "brand", label_ar: "Cafe", label_en: "Cafe", description: null, is_active: true, sort_order: 120 },
  { id: "events", role_type: "brand", label_ar: "Events", label_en: "Events", description: null, is_active: true, sort_order: 130 },
  { id: "technology", role_type: "brand", label_ar: "Technology", label_en: "Technology", description: null, is_active: true, sort_order: 140 },
  { id: "real_estate", role_type: "brand", label_ar: "Real Estate", label_en: "Real Estate", description: null, is_active: true, sort_order: 150 },
  { id: "brand_fashion", role_type: "brand", label_ar: "Fashion Brand", label_en: "Fashion Brand", description: null, is_active: true, sort_order: 160 },
  { id: "brand_food", role_type: "brand", label_ar: "Food Brand", label_en: "Food Brand", description: null, is_active: true, sort_order: 170 },
];

export function normalizeCategoryId(value: string | null | undefined): string {
  const raw = (value ?? "").trim().toLowerCase();
  if (!raw) return "";
  if (raw === "brand_fashion" || raw === "brand-fashion") return "brand_fashion";
  if (raw === "brand_food" || raw === "brand-food") return "brand_food";
  if (raw === "technology") return "technology";
  if (raw.includes("ugc") || raw.includes("content")) return "ugc";
  if (raw.includes("influencer")) return "influencer";
  if (raw.includes("fashion") || raw.includes("style")) return "fashion";
  if (raw.includes("food reviewer") || raw.includes("food-reviewer") || raw.includes("food_reviewer") || (raw.includes("food") && raw.includes("review"))) return "food_reviewer";
  if (raw.includes("tech reviewer") || raw.includes("tech-reviewer") || raw.includes("tech_reviewer")) return "tech_reviewer";
  if (raw.includes("unbox")) return "unboxing";
  if (raw.includes("host") || raw.includes("presenter")) return "host";
  if (raw.includes("restaurant")) return "restaurant";
  if (raw.includes("cafe")) return "cafe";
  if (raw.includes("event")) return "events";
  if (raw.includes("technology") || raw === "tech") return "technology";
  if (raw.includes("real estate") || raw.includes("real-estate") || raw.includes("real_estate")) return "real_estate";
  if (raw === "food") return "brand_food";
  return raw.replace(/[^a-z0-9\u0600-\u06ff]+/g, "_").replace(/^_+|_+$/g, "");
}

export async function fetchCategories(roleType?: CategoryRoleType, activeOnly = true): Promise<MarketplaceCategory[]> {
  let query = adminClient
    .from("categories")
    .select("id, role_type, label_ar, label_en, description, is_active, sort_order")
    .order("sort_order", { ascending: true });

  if (roleType) query = query.eq("role_type", roleType);
  if (activeOnly) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) {
    return fallbackCategories.filter((category) => (
      (!roleType || category.role_type === roleType) && (!activeOnly || category.is_active)
    ));
  }

  return (data ?? []) as MarketplaceCategory[];
}

export async function fetchProfileCategories(profileId: string): Promise<MarketplaceCategory[]> {
  const { data, error } = await adminClient
    .from("profile_categories")
    .select("categories(id, role_type, label_ar, label_en, description, is_active, sort_order)")
    .eq("profile_id", profileId);

  if (error) return [];

  return (data ?? [])
    .flatMap((row) => {
      const value = row.categories as MarketplaceCategory | MarketplaceCategory[] | null;
      return Array.isArray(value) ? value : value ? [value] : [];
    })
    .filter((category) => category.is_active);
}

export async function setProfileCategories(profileId: string, categoryIds: string[]): Promise<void> {
  const ids = [...new Set(categoryIds.map(normalizeCategoryId).filter(Boolean))];

  const { error: deleteError } = await adminClient
    .from("profile_categories")
    .delete()
    .eq("profile_id", profileId);
  if (deleteError) throw new Error(deleteError.message);

  if (!ids.length) return;

  const { error } = await adminClient
    .from("profile_categories")
    .insert(ids.map((category_id) => ({ profile_id: profileId, category_id })));
  if (error) throw new Error(error.message);
}

export async function upsertCategory(input: CategoryUpsertInput): Promise<MarketplaceCategory> {
  const payload = {
    id: normalizeCategoryId(input.id),
    role_type: input.role_type,
    label_ar: input.label_ar.trim(),
    label_en: input.label_en.trim(),
    description: input.description?.trim() || null,
    is_active: input.is_active,
    sort_order: input.sort_order,
  };

  const { data, error } = await adminClient
    .from("categories")
    .upsert(payload, { onConflict: "id" })
    .select("id, role_type, label_ar, label_en, description, is_active, sort_order")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Category save failed");
  return data as MarketplaceCategory;
}

export async function setCategoryActive(categoryId: string, isActive: boolean): Promise<void> {
  const { error } = await adminClient
    .from("categories")
    .update({ is_active: isActive })
    .eq("id", categoryId);

  if (error) throw new Error(error.message);
}
