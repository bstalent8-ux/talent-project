export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { setCategoryActive, upsertCategory } from "@/features/categories/services/category.service";

const categorySchema = z.object({
  id: z.string().trim().min(2),
  role_type: z.enum(["talent", "brand"]),
  label_ar: z.string().trim().min(2),
  label_en: z.string().trim().min(2),
  description: z.string().trim().nullable().optional(),
  is_active: z.boolean().default(true),
  sort_order: z.coerce.number().int().default(0),
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
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  try {
    const body = await req.json();
    const active = activeSchema.safeParse(body);
    if (active.success) {
      await setCategoryActive(id, active.data.is_active);
      return NextResponse.json({ ok: true });
    }

    const input = categorySchema.parse({ ...body, id });
    const category = await upsertCategory(input);
    return NextResponse.json({ category });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid category", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update category" },
      { status: 500 },
    );
  }
}
