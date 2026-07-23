export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { fetchCategories, upsertCategory } from "@/features/categories/services/category.service";

const categorySchema = z.object({
  id: z.string().trim().min(2),
  role_type: z.enum(["talent", "brand"]),
  label_ar: z.string().trim().min(2),
  label_en: z.string().trim().min(2),
  description: z.string().trim().nullable().optional(),
  is_active: z.boolean().default(true),
  sort_order: z.coerce.number().int().default(0),
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
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const categories = await fetchCategories(undefined, false);
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const input = categorySchema.parse(await req.json());
    const category = await upsertCategory(input);
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid category", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save category" },
      { status: 500 },
    );
  }
}
