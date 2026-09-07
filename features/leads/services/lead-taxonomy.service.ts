// ─── Leads CRM: channel + category taxonomies (SERVER ONLY) ─────────────────
// Generic CRUD shared by lead_channels (real-world marketing source) and
// lead_categories (talent type) — same shape, same rules, just two tables.
// See supabase/migrations/20260907_leads_channel_category.sql.

import { adminClient } from "@/lib/supabase/admin";
import type { LeadTaxonomySummary, LeadTaxonomyTerm } from "@/features/leads/types";

export type LeadTaxonomyTable = "lead_channels" | "lead_categories";
/** Column on `leads` this table's terms are referenced from. */
const COLUMN_BY_TABLE: Record<LeadTaxonomyTable, "channel_id" | "category_id"> = {
  lead_channels: "channel_id",
  lead_categories: "category_id",
};

interface TermRow {
  id: string; key: string; label_ar: string; label_en: string; sort_order: number; created_at: string;
}

function slugify(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export async function fetchTerms(table: LeadTaxonomyTable): Promise<LeadTaxonomyTerm[]> {
  const column = COLUMN_BY_TABLE[table];
  const [{ data: terms }, { data: leadRows }] = await Promise.all([
    adminClient.from(table).select("*").order("sort_order", { ascending: true }),
    adminClient.from("leads").select(column),
  ]);

  const countByTerm: Record<string, number> = {};
  for (const row of (leadRows ?? []) as Record<string, string | null>[]) {
    const id = row[column];
    if (id) countByTerm[id] = (countByTerm[id] ?? 0) + 1;
  }

  return ((terms ?? []) as TermRow[]).map((t) => ({
    id: t.id, key: t.key, labelAr: t.label_ar, labelEn: t.label_en, sortOrder: t.sort_order,
    leadCount: countByTerm[t.id] ?? 0,
  }));
}

/** Lightweight id -> summary map, same purpose as fetchStageSummaries(). */
export async function fetchTermSummaries(table: LeadTaxonomyTable): Promise<Record<string, LeadTaxonomySummary>> {
  const { data } = await adminClient.from(table).select("id, key, label_ar, label_en");
  const map: Record<string, LeadTaxonomySummary> = {};
  for (const t of data ?? []) {
    map[t.id] = { id: t.id, key: t.key, labelAr: t.label_ar, labelEn: t.label_en };
  }
  return map;
}

export async function createTerm(
  table: LeadTaxonomyTable,
  input: { key?: string; labelAr: string; labelEn: string },
  createdBy: string
): Promise<LeadTaxonomyTerm | null> {
  const key = slugify(input.key || input.labelEn);
  if (!/^[a-z][a-z0-9_]{1,40}$/.test(key)) return null;

  const { data: maxRow } = await adminClient
    .from(table).select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const nextOrder = (maxRow?.sort_order ?? -1) + 1;

  const { data, error } = await adminClient
    .from(table)
    .insert({ key, label_ar: input.labelAr, label_en: input.labelEn, sort_order: nextOrder, created_by: createdBy })
    .select("*")
    .single();
  if (error || !data) return null;

  const row = data as TermRow;
  return { id: row.id, key: row.key, labelAr: row.label_ar, labelEn: row.label_en, sortOrder: row.sort_order, leadCount: 0 };
}

export async function updateTerm(
  table: LeadTaxonomyTable,
  id: string,
  patch: { labelAr?: string; labelEn?: string }
): Promise<boolean> {
  const update: Record<string, string> = {};
  if (patch.labelAr !== undefined) update.label_ar = patch.labelAr;
  if (patch.labelEn !== undefined) update.label_en = patch.labelEn;
  if (Object.keys(update).length === 0) return true;

  const { error } = await adminClient.from(table).update(update).eq("id", id);
  return !error;
}

/** Swaps sort_order with the neighboring term — same approach as moveStage(). */
export async function moveTerm(table: LeadTaxonomyTable, id: string, direction: "up" | "down"): Promise<boolean> {
  const { data: terms } = await adminClient.from(table).select("id, sort_order").order("sort_order", { ascending: true });
  if (!terms) return false;
  const idx = terms.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= terms.length) return false;

  const a = terms[idx];
  const b = terms[swapIdx];
  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    adminClient.from(table).update({ sort_order: b.sort_order }).eq("id", a.id),
    adminClient.from(table).update({ sort_order: a.sort_order }).eq("id", b.id),
  ]);
  return !e1 && !e2;
}

/** Deletes a term. `leads.channel_id`/`category_id` is ON DELETE SET NULL,
 *  so any lead tagged with it just goes back to "unset" — no reassignment
 *  needed, unlike a stage delete (see deleteStage in lead-stages.service.ts). */
export async function deleteTerm(table: LeadTaxonomyTable, id: string): Promise<boolean> {
  const { error } = await adminClient.from(table).delete().eq("id", id);
  return !error;
}
