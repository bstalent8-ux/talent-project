export type BillingDuration = 1 | 3 | 6 | 12;

export type SubscriptionStatus = "pending" | "active" | "cancelled" | "expired";
export type PackageTargetType = "talent_type" | "all_talents" | "role" | "all_roles";
export type PackageAudience = "talent" | "brand" | "user" | "admin";

export interface TalentType {
  id: string;
  label_ar: string;
  label_en: string;
  is_active: boolean;
  sort_order: number;
}

export interface PackageTarget {
  id: string;
  package_id: string;
  target_type: PackageTargetType;
  target_id: string;
  talent_type?: TalentType | null;
}

export interface PackagePlan {
  id: string;
  package_id: string;
  duration_months: number;
  price: number;
  currency: string;
  is_active: boolean;
}

export interface PackageFeature {
  id: string;
  package_id: string;
  feature_key: string;
  feature_value: string;
}

export interface MarketplacePackage {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  targets: PackageTarget[];
  plans: PackagePlan[];
  features: PackageFeature[];
}

export interface PackageUpsertInput {
  name: string;
  description?: string | null;
  is_active: boolean;
  target_ids: string[];
  plans: Array<{
    id?: string;
    duration_months: number;
    price: number;
    currency: string;
    is_active: boolean;
  }>;
  features: Array<{
    id?: string;
    feature_key: string;
    feature_value: string;
  }>;
}

export interface SubscriptionRecord {
  id: string;
  user_id: string;
  plan_id: string;
  starts_at: string;
  expires_at: string;
  status: SubscriptionStatus;
}
