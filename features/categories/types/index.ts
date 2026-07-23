export type CategoryRoleType = "talent" | "brand";

export interface MarketplaceCategory {
  id: string;
  role_type: CategoryRoleType;
  label_ar: string;
  label_en: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface CategoryUpsertInput {
  id: string;
  role_type: CategoryRoleType;
  label_ar: string;
  label_en: string;
  description?: string | null;
  is_active: boolean;
  sort_order: number;
}
