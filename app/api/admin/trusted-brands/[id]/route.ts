export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { invalidateTrustedBrands, privateNoStoreHeaders } from "@/lib/cache";
import {
  deleteTrustedBrand,
  setTrustedBrandActive,
  updateTrustedBrand,
} from "@/features/trusted-brands/trusted-brands.service";

const trustedBrandSchema = z.object({
  name: z.string().trim().min(1),
  logo_url: z.string().trim().url().nullable().optional().or(z.literal("")),
  website_url: z.string().trim().url().nullable().optional().or(z.literal("")),
  display_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
});

const activeSchema = z.object({
  action: z.literal("set_active"),
  is_active: z.boolean(),
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: privateNoStoreHeaders() });

  const { id } = await params;

  try {
    const body = await req.json();
    const active = activeSchema.safeParse(body);
    if (active.success) {
      await setTrustedBrandActive(id, active.data.is_active);
      invalidateTrustedBrands();
      return NextResponse.json({ ok: true }, { headers: privateNoStoreHeaders() });
    }

    const input = trustedBrandSchema.parse(body);
    const brand = await updateTrustedBrand(id, input);
    invalidateTrustedBrands();
    return NextResponse.json({ brand }, { headers: privateNoStoreHeaders() });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid trusted brand", issues: error.issues }, { status: 400, headers: privateNoStoreHeaders() });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update trusted brand" },
      { status: 500, headers: privateNoStoreHeaders() },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: privateNoStoreHeaders() });

  const { id } = await params;

  try {
    await deleteTrustedBrand(id);
    invalidateTrustedBrands();
    return NextResponse.json({ ok: true }, { headers: privateNoStoreHeaders() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete trusted brand" },
      { status: 500, headers: privateNoStoreHeaders() },
    );
  }
}
