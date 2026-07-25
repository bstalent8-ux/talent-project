import crypto from "node:crypto";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function stableUuid(seed) {
  const hash = crypto.createHash("md5").update(seed).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

const tiers = [
  { key: "starter", name: "Starter", talentPrice: 490, brandPrice: 1490, actions: "10", visibility: "basic", support: "standard" },
  { key: "pro", name: "Professional", talentPrice: 990, brandPrice: 2990, actions: "30", visibility: "high", support: "priority" },
  { key: "scale", name: "Company", talentPrice: 1890, brandPrice: 5490, actions: "75", visibility: "premium", support: "dedicated" },
];

const { data: categories, error: categoryError } = await supabase
  .from("categories")
  .select("id, role_type, label_en, is_active")
  .in("role_type", ["talent", "brand"])
  .eq("is_active", true);

if (categoryError) throw new Error(categoryError.message);
if (!categories?.length) throw new Error("No active talent/brand categories found");

const packages = [];
const packageCategories = [];
const plans = [];
const features = [];

for (const category of categories) {
  for (const tier of tiers) {
    const packageId = stableUuid(`v1-demo-package:${category.id}:${tier.key}`);
    const price = category.role_type === "brand" ? tier.brandPrice : tier.talentPrice;

    packages.push({
      id: packageId,
      name: `${category.label_en} ${tier.name}`,
      description: category.role_type === "brand"
        ? `${tier.name} package for brands testing campaigns and creator shortlists.`
        : `${tier.name} package for talents testing visibility, applications, and profile growth.`,
      is_active: true,
    });
    packageCategories.push({ package_id: packageId, category_id: category.id });
    plans.push({ package_id: packageId, duration_months: 1, price, currency: "EGP", is_active: true });
    features.push(
      { package_id: packageId, feature_key: "monthly_actions", feature_value: tier.actions },
      { package_id: packageId, feature_key: "priority_visibility", feature_value: tier.visibility },
      { package_id: packageId, feature_key: "support_level", feature_value: tier.support },
    );
  }
}

async function upsert(table, rows, onConflict) {
  const { error } = await supabase.from(table).upsert(rows, { onConflict });
  if (error) throw new Error(`${table}: ${error.message}`);
}

await upsert("packages", packages, "id");
await upsert("package_categories", packageCategories, "package_id,category_id");
await upsert("package_plans", plans, "package_id,duration_months,currency");
await upsert("package_features", features, "package_id,feature_key");

console.log(`Seeded ${packages.length} packages across ${categories.length} role categories.`);
