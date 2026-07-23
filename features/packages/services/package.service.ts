import { adminClient } from "@/lib/supabase/admin";
import { fetchCategories, fetchProfileCategories, normalizeCategoryId, setProfileCategories } from "@/features/categories/services/category.service";
import type { CategoryRoleType, MarketplaceCategory } from "@/features/categories/types";
import type {
  MarketplacePackage,
  PackageAudience,
  PackageCategory,
  PackageFeature,
  PackagePlan,
  PackageTarget,
  PackageTargetType,
  PackageUpsertInput,
  SubscriptionRecord,
  TalentType,
} from "../types";

const PACKAGE_SELECT = `
  id, name, description, is_active, created_at, updated_at,
  package_categories (
    id, package_id, category_id,
    categories (id, role_type, label_ar, label_en, description, is_active, sort_order)
  ),
  package_plans (
    id, package_id, duration_months, price, currency, is_active
  ),
  package_features (
    id, package_id, feature_key, feature_value
  )
`;

const ALL_TALENTS_TARGET_ID = "all";
const ALL_ROLES_TARGET_ID = "all";
const BRAND_TARGET_ID = "brand";
const ROLE_TARGETS = new Set(["talent", "brand", "user", "admin"]);

export function normalizeTalentTypeId(value: string | null | undefined): string {
  const raw = (value ?? "").trim().toLowerCase();
  if (!raw) return "";
  if (raw === "all_roles" || raw === "all-roles" || raw === "everyone") return "all_roles";
  if (raw === "all_talents" || raw === "all-talents" || raw === "all") return "all_talents";
  if (raw === "user" || raw === "users") return "user";
  if (raw === "admin" || raw === "admins") return "admin";
  if (raw === "talent" || raw === "talents") return "talent";
  if (raw.includes("fashion") || raw.includes("style") || raw.includes("mode")) return "fashion";
  if (raw.includes("food reviewer") || raw.includes("food-reviewer") || raw.includes("food_reviewer") || (raw.includes("food") && raw.includes("review"))) return "food_reviewer";
  if (raw.includes("media buyer") || raw.includes("media-buyer") || raw.includes("media_buyers") || raw.includes("media buyers") || raw.includes("ads buyer")) return "media_buyers";
  if (raw === "brand" || raw === "brands" || raw.includes("company") || raw.includes("براند") || raw.includes("شركة")) return "brand";

  if (raw.includes("ugc") || raw.includes("content") || raw.includes("محتوى") || raw.includes("كونتنت")) return "ugc";
  if (raw.includes("influencer") || raw.includes("مؤثر") || raw.includes("تأثير")) return "influencer";
  if (raw.includes("host") || raw.includes("presenter") || raw.includes("مذيع") || raw.includes("مقدم")) return "host";
  if (raw.includes("model") || raw.includes("موديل") || raw.includes("أزياء") || raw.includes("فاشن")) return "model";
  if (raw.includes("actor") || raw.includes("acting") || raw.includes("ممثل") || raw.includes("تمثيل")) return "actor";
  if (raw.includes("photo") || raw.includes("مصور")) return "photographer";
  if (raw.includes("video") || raw.includes("reel") || raw.includes("فيديو")) return "videographer";
  if (raw.includes("design") || raw.includes("مصمم") || raw.includes("تصميم")) return "designer";

  return raw
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizePackageAudience(value: string | null | undefined): PackageAudience {
  const normalized = normalizeTalentTypeId(value);
  if (normalized === "brand" || normalized === "user" || normalized === "admin") return normalized;
  return "talent";
}

export function packageTargetValue(target: Pick<PackageTarget, "target_type" | "target_id">): string {
  if (target.target_type === "all_roles") return "all_roles";
  if (target.target_type === "all_talents") return "all_talents";
  if (target.target_type === "role" && target.target_id === BRAND_TARGET_ID) return "brand";
  return target.target_id;
}

function packageTargetFromValue(value: string): Pick<PackageTarget, "target_type" | "target_id"> | null {
  const normalized = normalizeTalentTypeId(value);
  if (!normalized) return null;
  if (normalized === "all_roles") {
    return { target_type: "all_roles", target_id: ALL_ROLES_TARGET_ID };
  }
  if (normalized === "all_talents") {
    return { target_type: "all_talents", target_id: ALL_TALENTS_TARGET_ID };
  }
  if (ROLE_TARGETS.has(normalized)) {
    return { target_type: "role", target_id: normalized };
  }
  return { target_type: "talent_type", target_id: normalized };
}

function targetMatchesAudience(
  target: Pick<PackageTarget, "target_type" | "target_id">,
  audience: PackageAudience,
  talentType?: string,
): boolean {
  if (target.target_type === "all_roles" && target.target_id === ALL_ROLES_TARGET_ID) {
    return true;
  }

  if (audience === "brand") {
    return target.target_type === "role" && target.target_id === BRAND_TARGET_ID;
  }

  if (audience === "user" || audience === "admin") {
    return target.target_type === "role" && target.target_id === audience;
  }

  return (
    (target.target_type === "all_talents" && target.target_id === ALL_TALENTS_TARGET_ID)
    || (target.target_type === "role" && target.target_id === "talent")
    || (target.target_type === "talent_type" && target.target_id === talentType)
  );
}

function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function mapPackage(row: Record<string, unknown>): MarketplacePackage {
  const targets = asArray(row.package_targets as Record<string, unknown>[])
    .map((target) => ({
      id: String(target.id),
      package_id: String(target.package_id),
      target_type: String(target.target_type ?? "talent_type") as PackageTargetType,
      target_id: String(target.target_id),
      talent_type: null,
    })) satisfies PackageTarget[];

  const categories = asArray(row.package_categories as Record<string, unknown>[])
    .map((item) => ({
      id: String(item.id),
      package_id: String(item.package_id),
      category_id: String(item.category_id),
      category: asArray(item.categories as MarketplaceCategory | MarketplaceCategory[] | null)[0] ?? null,
    })) satisfies PackageCategory[];

  const plans = asArray(row.package_plans as Record<string, unknown>[])
    .map((plan) => ({
      id: String(plan.id),
      package_id: String(plan.package_id),
      duration_months: Number(plan.duration_months),
      price: Number(plan.price),
      currency: String(plan.currency ?? "EGP"),
      is_active: Boolean(plan.is_active),
    }))
    .sort((a, b) => a.duration_months - b.duration_months) satisfies PackagePlan[];

  const features = asArray(row.package_features as Record<string, unknown>[])
    .map((feature) => ({
      id: String(feature.id),
      package_id: String(feature.package_id),
      feature_key: String(feature.feature_key),
      feature_value: String(feature.feature_value),
    }))
    .sort((a, b) => a.feature_key.localeCompare(b.feature_key)) satisfies PackageFeature[];

  return {
    id: String(row.id),
    name: String(row.name),
    description: typeof row.description === "string" ? row.description : null,
    is_active: Boolean(row.is_active),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    targets,
    categories,
    plans,
    features,
  };
}

export async function fetchTalentTypes(activeOnly = true): Promise<TalentType[]> {
  const categories = await fetchCategories("talent", activeOnly);
  return categories.map((category) => ({
    id: category.id,
    label_ar: category.label_ar,
    label_en: category.label_en,
    is_active: category.is_active,
    sort_order: category.sort_order,
  }));
}

export async function fetchPackageCategories(activeOnly = true): Promise<MarketplaceCategory[]> {
  return fetchCategories(undefined, activeOnly);
}

export async function fetchAdminPackages(): Promise<MarketplacePackage[]> {
  const { data, error } = await adminClient
    .from("packages")
    .select(PACKAGE_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapPackage(row as Record<string, unknown>));
}

export async function fetchPublicPackagesByTalentType(
  talentType: string,
  limit?: number,
): Promise<MarketplacePackage[]> {
  return fetchPublicPackagesByAudience(talentType, limit);
}

export async function fetchPublicPackagesByAudience(
  value: string,
  limit?: number,
): Promise<MarketplacePackage[]> {
  const normalized = normalizeTalentTypeId(value);
  const audience = normalizePackageAudience(value);
  const categoryId = normalizeCategoryId(normalized);
  const roleType: CategoryRoleType = audience === "brand" ? "brand" : "talent";

  const { data: categoryRows, error: categoryError } = await adminClient
    .from("package_categories")
    .select("package_id, category_id, categories(role_type)")
    .eq("category_id", categoryId);

  if (!categoryError) {
    const packageIds = [
      ...new Set(
        (categoryRows ?? [])
          .filter((row) => {
            const category = asArray(row.categories as { role_type?: string } | { role_type?: string }[] | null)[0];
            return !category?.role_type || category.role_type === roleType;
          })
          .map((row) => row.package_id as string),
      ),
    ];
    if (!packageIds.length) return [];

    let query = adminClient
      .from("packages")
      .select(PACKAGE_SELECT)
      .in("id", packageIds)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return (data ?? [])
      .map((row) => mapPackage(row as Record<string, unknown>))
      .map((pkg) => ({
        ...pkg,
        plans: pkg.plans.filter((plan) => plan.is_active),
      }))
      .filter((pkg) => pkg.categories.some((category) => category.category_id === categoryId) && pkg.plans.length > 0);
  }

  const talentType = audience === "talent" && normalized !== "all_talents" ? normalized : undefined;

  const { data: targetRows, error: targetError } = await adminClient
    .from("package_targets")
    .select("package_id, target_type, target_id");

  if (targetError) throw new Error(targetError.message);

  const packageIds = [
    ...new Set(
      (targetRows ?? [])
        .filter((row) => targetMatchesAudience(row as PackageTarget, audience, talentType))
        .map((row) => row.package_id as string),
    ),
  ];
  if (!packageIds.length) return [];

  let query = adminClient
    .from("packages")
    .select(PACKAGE_SELECT)
    .in("id", packageIds)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((row) => mapPackage(row as Record<string, unknown>))
    .map((pkg) => ({
      ...pkg,
      plans: pkg.plans.filter((plan) => plan.is_active),
    }))
    .filter((pkg) => pkg.targets.some((target) => targetMatchesAudience(target, audience, talentType)) && pkg.plans.length > 0);
}

export async function upsertAdminPackage(input: PackageUpsertInput, packageId?: string): Promise<MarketplacePackage> {
  const packagePayload = {
    name: input.name.trim(),
    description: input.description?.trim() || null,
    is_active: input.is_active,
  };

  const packageQuery = packageId
    ? adminClient.from("packages").update(packagePayload).eq("id", packageId).select("id").single()
    : adminClient.from("packages").insert(packagePayload).select("id").single();

  const { data: packageRow, error: packageError } = await packageQuery;
  if (packageError || !packageRow) throw new Error(packageError?.message ?? "Package save failed");

  const id = packageRow.id as string;

  const deleteResults = await Promise.all([
    adminClient.from("package_targets").delete().eq("package_id", id),
    adminClient.from("package_categories").delete().eq("package_id", id),
    adminClient.from("package_plans").delete().eq("package_id", id),
    adminClient.from("package_features").delete().eq("package_id", id),
  ]);

  const deleteError = deleteResults.find((result, index) => index > 1 && result.error)?.error;
  if (deleteError) throw new Error(deleteError.message);

  const packageCategories = [...new Set(input.target_ids.map(normalizeCategoryId).filter(Boolean))]
    .map((category_id) => ({
      package_id: id,
      category_id,
    }));

  const plans = input.plans
    .filter((plan) => plan.duration_months > 0)
    .map((plan) => ({
      package_id: id,
      duration_months: plan.duration_months,
      price: plan.price,
      currency: plan.currency.trim().toUpperCase() || "EGP",
      is_active: plan.is_active,
    }));

  const features = input.features
    .filter((feature) => feature.feature_key.trim() && feature.feature_value.trim())
    .map((feature) => ({
      package_id: id,
      feature_key: feature.feature_key.trim(),
      feature_value: feature.feature_value.trim(),
    }));

  const writes = [];
  if (packageCategories.length) writes.push(adminClient.from("package_categories").insert(packageCategories));
  if (plans.length) writes.push(adminClient.from("package_plans").insert(plans));
  if (features.length) writes.push(adminClient.from("package_features").insert(features));

  const results = await Promise.all(writes);
  const writeError = results.find((result) => result.error)?.error;
  if (writeError) throw new Error(writeError.message);

  const packages = await fetchAdminPackages();
  const saved = packages.find((pkg) => pkg.id === id);
  if (!saved) throw new Error("Package saved but could not be loaded");
  return saved;
}

export async function setPackageActive(packageId: string, isActive: boolean): Promise<void> {
  const { error } = await adminClient
    .from("packages")
    .update({ is_active: isActive })
    .eq("id", packageId);

  if (error) throw new Error(error.message);
}

export async function createActiveSubscription(input: {
  userId: string;
  planId: string;
  talentType?: string | null;
  audience?: string | null;
}): Promise<SubscriptionRecord> {
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, role, talent_profiles(id, category)")
    .eq("id", input.userId)
    .single();

  if (profileError || !profile) throw new Error("Profile not found");

  const role = String((profile as Record<string, unknown>).role ?? "");
  const requestedAudience = normalizePackageAudience(input.audience || role);
  const tp = asArray((profile as Record<string, unknown>).talent_profiles as Record<string, unknown>[])[0];
  const profileCategories = await fetchProfileCategories(input.userId);
  const requestedCategory = normalizeCategoryId(input.talentType || profileCategories[0]?.id || String(tp?.category ?? ""));
  const resolvedTalentType = normalizeTalentTypeId(requestedCategory);

  if (requestedAudience === "brand" && role !== "brand") {
    throw new Error("Only brand accounts can subscribe to brand packages");
  }
  if (requestedAudience === "talent" && role !== "talent") {
    throw new Error("Only talent accounts can subscribe to talent packages");
  }
  if (requestedAudience === "talent" && !requestedCategory) throw new Error("Talent type is required");

  const { data: plan, error: planError } = await adminClient
    .from("package_plans")
    .select(`
      id, package_id, duration_months, price, currency, is_active,
      packages (
        id, is_active,
        package_categories (id, category_id, categories(role_type))
      )
    `)
    .eq("id", input.planId)
    .maybeSingle();

  if (planError || !plan) throw new Error("Plan not found");
  if (!plan.is_active) throw new Error("Plan is not active");

  const pkg = asArray((plan as Record<string, unknown>).packages as Record<string, unknown>[])[0];
  if (!pkg?.is_active) throw new Error("Package is not active");

  const targets = asArray(pkg.package_targets as Record<string, unknown>[]);
  const categoryTargets = asArray(pkg.package_categories as Record<string, unknown>[]);
  const matchesCategory = categoryTargets.some((target) => {
    const category = asArray(target.categories as { role_type?: string } | { role_type?: string }[] | null)[0];
    return String(target.category_id) === requestedCategory
      && (!category?.role_type || category.role_type === requestedAudience);
  });
  const matchesTarget = targets.some((target) => (
    targetMatchesAudience(
      {
        target_type: String(target.target_type ?? "talent_type") as PackageTargetType,
        target_id: String(target.target_id ?? ""),
      },
      requestedAudience,
      resolvedTalentType,
    )
  ));
  if (!matchesCategory && !matchesTarget) throw new Error("Package is not available for this account type");

  const startsAt = new Date();
  const expiresAt = new Date(startsAt);
  expiresAt.setMonth(expiresAt.getMonth() + Number(plan.duration_months));

  await adminClient
    .from("subscriptions")
    .update({ status: "cancelled" })
    .eq("user_id", input.userId)
    .eq("status", "active");

  const { data: subscription, error: subscriptionError } = await adminClient
    .from("subscriptions")
    .insert({
      user_id: input.userId,
      plan_id: input.planId,
      starts_at: startsAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      status: "active",
    })
    .select("id, user_id, plan_id, starts_at, expires_at, status")
    .single();

  if (subscriptionError || !subscription) {
    throw new Error(subscriptionError?.message ?? "Subscription creation failed");
  }

  return subscription as SubscriptionRecord;
}
