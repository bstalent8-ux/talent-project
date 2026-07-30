export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { invalidateTrustedBrands, privateNoStoreHeaders } from "@/lib/cache";
import {
  createTrustedBrand,
  fetchAdminTrustedBrands,
  reorderTrustedBrands,
} from "@/features/trusted-brands/trusted-brands.service";

const trustedBrandSchema = z.object({
  name: z.string().trim().min(1),
  logo_url: z.string().trim().url().nullable().optional().or(z.literal("")),
  website_url: z.string().trim().url().nullable().optional().or(z.literal("")),
  display_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
});

const reorderSchema = z.object({
  action: z.literal("reorder"),
  ids: z.array(z.string().uuid()).min(1),
});

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "admin" ? user : null;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: privateNoStoreHeaders() });

  try {
    const brands = await fetchAdminTrustedBrands();
    return NextResponse.json({ brands }, { headers: privateNoStoreHeaders() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load trusted brands" },
      { status: 500, headers: privateNoStoreHeaders() },
    );
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: privateNoStoreHeaders() });

  try {
    const body = await req.json();
    const reorder = reorderSchema.safeParse(body);
    if (reorder.success) {
      const brands = await reorderTrustedBrands(reorder.data.ids);
      invalidateTrustedBrands();
      return NextResponse.json({ brands }, { headers: privateNoStoreHeaders() });
    }

    const input = trustedBrandSchema.parse(body);
    const brand = await createTrustedBrand(input);
    invalidateTrustedBrands();
    return NextResponse.json({ brand }, { status: 201, headers: privateNoStoreHeaders() });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid trusted brand", issues: error.issues }, { status: 400, headers: privateNoStoreHeaders() });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save trusted brand" },
      { status: 500, headers: privateNoStoreHeaders() },
    );
  }
}
