// ─── Recruitment CRM: job-category taxonomy (SERVER ONLY) ───────────────────
// Mirrors features/leads/services/lead-taxonomy.service.ts, but only one
// table here (candidate_categories) — candidates don't have a "channel"
// concept the way leads do.

import { adminClient } from "@/lib/supabase/admin";
import type { CandidateCategorySummary, CandidateCategoryTerm } from "@/features/candidates/types";

interface TermRow {
  id: string; key: string; label_ar: string; label_en: string; sort_order: number; created_at: string;
}

function slugify(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export async function fetchCategories(): Promise<CandidateCategoryTerm[]> {
  const [{ data: terms }, { data: candidateRows }] = await Promise.all([
    adminClient.from("candidate_categories").select("*").order("sort_order", { ascending: true }),
    adminClient.from("candidates").select("category_id"),
  ]);

  const countByTerm: Record<string, number> = {};
  for (const row of candidateRows ?? []) {
    if (row.category_id) countByTerm[row.category_id] = (countByTerm[row.category_id] ?? 0) + 1;
  }

  return ((terms ?? []) as TermRow[]).map((t) => ({
    id: t.id, key: t.key, labelAr: t.label_ar, labelEn: t.label_en, sortOrder: t.sort_order,
    candidateCount: countByTerm[t.id] ?? 0,
  }));
}

export async function fetchCategorySummaries(): Promise<Record<string, CandidateCategorySummary>> {
  const { data } = await adminClient.from("candidate_categories").select("id, key, label_ar, label_en");
  const map: Record<string, CandidateCategorySummary> = {};
  for (const t of data ?? []) {
    map[t.id] = { id: t.id, key: t.key, labelAr: t.label_ar, labelEn: t.label_en };
  }
  return map;
}

export async function createCategory(
  input: { key?: string; labelAr: string; labelEn: string },
  createdBy: string
): Promise<CandidateCategoryTerm | null> {
  const key = slugify(input.key || input.labelEn);
  if (!/^[a-z][a-z0-9_]{1,40}$/.test(key)) return null;

  const { data: maxRow } = await adminClient
    .from("candidate_categories").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const nextOrder = (maxRow?.sort_order ?? -1) + 1;

  const { data, error } = await adminClient
    .from("candidate_categories")
    .insert({ key, label_ar: input.labelAr, label_en: input.labelEn, sort_order: nextOrder, created_by: createdBy })
    .select("*")
    .single();
  if (error || !data) return null;

  const row = data as TermRow;
  return { id: row.id, key: row.key, labelAr: row.label_ar, labelEn: row.label_en, sortOrder: row.sort_order, candidateCount: 0 };
}

export async function updateCategory(id: string, patch: { labelAr?: string; labelEn?: string }): Promise<boolean> {
  const update: Record<string, string> = {};
  if (patch.labelAr !== undefined) update.label_ar = patch.labelAr;
  if (patch.labelEn !== undefined) update.label_en = patch.labelEn;
  if (Object.keys(update).length === 0) return true;

  const { error } = await adminClient.from("candidate_categories").update(update).eq("id", id);
  return !error;
}

export async function moveCategory(id: string, direction: "up" | "down"): Promise<boolean> {
  const { data: terms } = await adminClient.from("candidate_categories").select("id, sort_order").order("sort_order", { ascending: true });
  if (!terms) return false;
  const idx = terms.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= terms.length) return false;

  const a = terms[idx];
  const b = terms[swapIdx];
  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    adminClient.from("candidate_categories").update({ sort_order: b.sort_order }).eq("id", a.id),
    adminClient.from("candidate_categories").update({ sort_order: a.sort_order }).eq("id", b.id),
  ]);
  return !e1 && !e2;
}

/** `candidates.category_id` is ON DELETE SET NULL — no reassignment needed. */
export async function deleteCategory(id: string): Promise<boolean> {
  const { error } = await adminClient.from("candidate_categories").delete().eq("id", id);
  return !error;
}
