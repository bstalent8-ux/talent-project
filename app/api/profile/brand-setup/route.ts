export const runtime = 'edge';

// ─── PATCH /api/profile/brand-setup ───────────────────────────────────────────
// Saves one step of the brand profile wizard (/profile/brand-setup). Brand
// accounts only, and only their own row. Three writes, each for the fields the
// step actually sent:
//   • profiles           — full_name, city, bio
//   • brand_profiles core — through profileService (provider writable-field
//                           allowlist, status seeding) — company_name,
//                           category_id, industry, website_url, social_links
//   • brand_profiles extras — tagline, company_size, founded_year, tags
//                           (20260926_brand_public_page.sql; a missing column
//                           returns 409 migration_required, core still saved)

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { invalidateBrand, privateNoStoreHeaders } from "@/lib/cache";
import { normalizeCategoryId } from "@/features/categories/matching";
import { ProfileError, profileService } from "@/features/profiles";

const text = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) => text(max).nullable().optional();

const SOCIAL_KEYS = ["instagram", "tiktok", "youtube", "facebook", "linkedin", "x"] as const;

const bodySchema = z.object({
  full_name:    text(100).min(1).optional(),
  city:         optionalText(60),
  bio:          optionalText(1000),
  category_id:  optionalText(60),
  industry:     optionalText(80),
  website_url:  optionalText(300),
  social:       z.object(Object.fromEntries(SOCIAL_KEYS.map((k) => [k, optionalText(200)]))).partial().optional(),
  tagline:      optionalText(120),
  company_size: z.enum(["1-10", "11-50", "51-200", "201-500", "500+"]).nullable().optional(),
  founded_year: z.number().int().min(1800).max(new Date().getFullYear()).nullable().optional(),
  tags:         z.array(text(30).min(1)).max(8).optional(),
}).strict();

const MISSING_COLUMN = new Set(["42703", "PGRST204"]);

export async function PATCH(req: NextRequest) {
  const headers = privateNoStoreHeaders();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers });

  const { data: profile } = await adminClient
    .from("profiles").select("role, handle").eq("id", user.id).maybeSingle();
  if (profile?.role !== "brand") return NextResponse.json({ error: "brands only" }, { status: 403, headers });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid request body", issues: parsed.error.issues }, { status: 400, headers });
  const b = parsed.data;
  const has = (k: keyof typeof b) => Object.prototype.hasOwnProperty.call(b, k);
  const blank = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);

  // ── profiles ──
  const shared: Record<string, unknown> = {};
  if (has("full_name")) shared.full_name = b.full_name;
  if (has("city")) shared.city = blank(b.city);
  if (has("bio")) shared.bio = blank(b.bio);
  if (Object.keys(shared).length) {
    const { error } = await adminClient.from("profiles").update(shared).eq("id", user.id);
    if (error) {
      console.error("[brand-setup] profiles", error);
      return NextResponse.json({ error: "save failed" }, { status: 500, headers });
    }
  }

  // ── brand_profiles core (provider layer) ──
  const core: Record<string, unknown> = {};
  if (has("full_name")) core.company_name = b.full_name;
  if (has("category_id")) core.category_id = b.category_id ? normalizeCategoryId(b.category_id) || null : null;
  if (has("industry")) core.industry = blank(b.industry);
  if (has("website_url")) core.website_url = blank(b.website_url);
  if (has("social")) {
    // social_links is shared with other keys — merge, never replace.
    const { data: row } = await adminClient.from("brand_profiles").select("social_links").eq("user_id", user.id).maybeSingle();
    const merged: Record<string, unknown> = { ...((row?.social_links as Record<string, unknown>) ?? {}) };
    for (const k of SOCIAL_KEYS) if (b.social && k in b.social) merged[k] = blank(b.social[k]) ?? "";
    core.social_links = merged;
  }
  if (Object.keys(core).length) {
    try {
      await profileService.updateCoreForUser(user.id, core);
    } catch (e) {
      const err = ProfileError.from(e);
      console.error("[brand-setup] core", err.code, err.internal);
      return NextResponse.json(err.toBody(), { status: err.status, headers });
    }
  }

  // ── brand_profiles extras (new columns) ──
  const extras: Record<string, unknown> = {};
  if (has("tagline")) extras.tagline = blank(b.tagline);
  if (has("company_size")) extras.company_size = b.company_size ?? null;
  if (has("founded_year")) extras.founded_year = b.founded_year ?? null;
  if (has("tags")) extras.tags = [...new Set((b.tags ?? []).map((t) => t.trim()).filter(Boolean))];

  let migrationRequired = false;
  if (Object.keys(extras).length) {
    const { error } = await adminClient.from("brand_profiles").update(extras).eq("user_id", user.id);
    if (error) {
      if (MISSING_COLUMN.has(error.code ?? "")) migrationRequired = true;
      else {
        console.error("[brand-setup] extras", error);
        return NextResponse.json({ error: "save failed" }, { status: 500, headers });
      }
    }
  }

  invalidateBrand(profile.handle ?? null);
  invalidateBrand(user.id);

  if (migrationRequired) return NextResponse.json({ error: "migration_required", saved: "partial" }, { status: 409, headers });
  return NextResponse.json({ ok: true }, { headers });
}
