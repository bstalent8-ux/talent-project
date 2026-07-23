export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import {
  fetchAdminPackages,
  fetchTalentTypes,
  upsertAdminPackage,
} from "@/features/packages/services/package.service";

const planSchema = z.object({
  duration_months: z.coerce.number().int().positive(),
  price: z.coerce.number().min(0),
  currency: z.string().trim().min(1).default("EGP"),
  is_active: z.boolean().default(true),
});

const featureSchema = z.object({
  feature_key: z.string().trim().min(1),
  feature_value: z.string().trim().min(1),
});

const packageSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().nullable().optional(),
  is_active: z.boolean().default(true),
  target_ids: z.array(z.string().trim().min(1)).min(1),
  plans: z.array(planSchema).min(1),
  features: z.array(featureSchema).default([]),
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

  try {
    const [packages, talentTypes] = await Promise.all([
      fetchAdminPackages(),
      fetchTalentTypes(false),
    ]);
    return NextResponse.json({ packages, talentTypes });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load admin packages" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const input = packageSchema.parse(await req.json());
    const pkg = await upsertAdminPackage(input);
    return NextResponse.json({ package: pkg }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid package", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create package" },
      { status: 500 },
    );
  }
}
