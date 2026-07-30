export type TrustedBrand = {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PublicTrustedBrand = Pick<
  TrustedBrand,
  "id" | "name" | "logo_url" | "website_url"
>;

export type TrustedBrandInput = {
  name: string;
  logo_url?: string | null;
  website_url?: string | null;
  display_order?: number;
  is_active?: boolean;
};
