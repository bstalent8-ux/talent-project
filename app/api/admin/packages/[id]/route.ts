export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import {
  setPackageActive,
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
      await setPackageActive(id, active.data.is_active);
      return NextResponse.json({ ok: true });
    }

    const input = packageSchema.parse(body);
    const pkg = await upsertAdminPackage(input, id);
    return NextResponse.json({ package: pkg });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid package", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update package" },
      { status: 500 },
    );
  }
}
