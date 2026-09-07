// ─── Recruitment CRM: dynamic pipeline stages (SERVER ONLY) ─────────────────
// Mirrors features/leads/services/lead-stages.service.ts exactly, targeting
// candidate_stages/candidate_stage_fields/candidates instead.

import { adminClient } from "@/lib/supabase/admin";
import type { CandidateStage, CandidateStageField, CandidateStageSummary, StageFieldOption, StageFieldType } from "@/features/candidates/types";

interface StageRow {
  id: string; key: string; label_ar: string; label_en: string; color: string;
  sort_order: number; created_at: string;
}
interface FieldRow {
  id: string; stage_id: string; field_key: string; label_ar: string; label_en: string;
  field_type: StageFieldType; options: StageFieldOption[] | null; required: boolean; sort_order: number;
}

function toField(row: FieldRow): CandidateStageField {
  return {
    id: row.id, stageId: row.stage_id, fieldKey: row.field_key,
    labelAr: row.label_ar, labelEn: row.label_en, fieldType: row.field_type,
    options: row.options, required: row.required, sortOrder: row.sort_order,
  };
}

export async function fetchStages(): Promise<CandidateStage[]> {
  const [{ data: stages }, { data: fields }, { data: candidateRows }] = await Promise.all([
    adminClient.from("candidate_stages").select("*").order("sort_order", { ascending: true }),
    adminClient.from("candidate_stage_fields").select("*").order("sort_order", { ascending: true }),
    adminClient.from("candidates").select("stage_id"),
  ]);

  const fieldsByStage: Record<string, CandidateStageField[]> = {};
  for (const f of (fields ?? []) as FieldRow[]) (fieldsByStage[f.stage_id] ??= []).push(toField(f));

  const countByStage: Record<string, number> = {};
  for (const row of candidateRows ?? []) {
    if (row.stage_id) countByStage[row.stage_id] = (countByStage[row.stage_id] ?? 0) + 1;
  }

  return ((stages ?? []) as StageRow[]).map((s) => ({
    id: s.id, key: s.key, labelAr: s.label_ar, labelEn: s.label_en, color: s.color, sortOrder: s.sort_order,
    fields: fieldsByStage[s.id] ?? [],
    candidateCount: countByStage[s.id] ?? 0,
  }));
}

export async function fetchStageSummaries(): Promise<Record<string, CandidateStageSummary>> {
  const { data } = await adminClient.from("candidate_stages").select("id, key, label_ar, label_en, color");
  const map: Record<string, CandidateStageSummary> = {};
  for (const s of data ?? []) {
    map[s.id] = { id: s.id, key: s.key, labelAr: s.label_ar, labelEn: s.label_en, color: s.color };
  }
  return map;
}

export async function fetchDefaultStageId(): Promise<string | null> {
  const { data } = await adminClient.from("candidate_stages").select("id").order("sort_order", { ascending: true }).limit(1).maybeSingle();
  return data?.id ?? null;
}

export async function fetchStageFields(stageId: string): Promise<CandidateStageField[]> {
  const { data } = await adminClient.from("candidate_stage_fields").select("*").eq("stage_id", stageId).order("sort_order", { ascending: true });
  return ((data ?? []) as FieldRow[]).map(toField);
}

function slugify(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export async function createStage(
  input: { key?: string; labelAr: string; labelEn: string; color?: string }
): Promise<CandidateStage | null> {
  const key = slugify(input.key || input.labelEn);
  if (!/^[a-z][a-z0-9_]{1,40}$/.test(key)) return null;

  const { data: maxRow } = await adminClient
    .from("candidate_stages").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const nextOrder = (maxRow?.sort_order ?? -1) + 1;

  const { data, error } = await adminClient
    .from("candidate_stages")
    .insert({ key, label_ar: input.labelAr, label_en: input.labelEn, color: input.color || "#00D26A", sort_order: nextOrder })
    .select("*")
    .single();
  if (error || !data) return null;

  const row = data as StageRow;
  return { id: row.id, key: row.key, labelAr: row.label_ar, labelEn: row.label_en, color: row.color, sortOrder: row.sort_order, fields: [], candidateCount: 0 };
}

export async function updateStage(id: string, patch: { labelAr?: string; labelEn?: string; color?: string }): Promise<boolean> {
  const update: Record<string, string> = {};
  if (patch.labelAr !== undefined) update.label_ar = patch.labelAr;
  if (patch.labelEn !== undefined) update.label_en = patch.labelEn;
  if (patch.color !== undefined) update.color = patch.color;
  if (Object.keys(update).length === 0) return true;

  const { error } = await adminClient.from("candidate_stages").update(update).eq("id", id);
  return !error;
}

export async function moveStage(id: string, direction: "up" | "down"): Promise<boolean> {
  const { data: stages } = await adminClient.from("candidate_stages").select("id, sort_order").order("sort_order", { ascending: true });
  if (!stages) return false;
  const idx = stages.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= stages.length) return false;

  const a = stages[idx];
  const b = stages[swapIdx];
  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    adminClient.from("candidate_stages").update({ sort_order: b.sort_order }).eq("id", a.id),
    adminClient.from("candidate_stages").update({ sort_order: a.sort_order }).eq("id", b.id),
  ]);
  return !e1 && !e2;
}

export interface DeleteStageResult {
  ok: boolean;
  reassignedCount: number;
  error?: string;
}

export async function deleteStage(id: string): Promise<DeleteStageResult> {
  const { data: stages } = await adminClient.from("candidate_stages").select("id, sort_order").order("sort_order", { ascending: true });
  if (!stages || stages.length === 0) return { ok: false, reassignedCount: 0, error: "stage not found" };

  const remaining = stages.filter((s) => s.id !== id);
  if (remaining.length === 0) {
    return { ok: false, reassignedCount: 0, error: "can't delete the only remaining stage" };
  }

  const idx = stages.findIndex((s) => s.id === id);
  const fallback = stages[idx + 1] ?? stages[idx - 1];

  const { count } = await adminClient.from("candidates").select("id", { count: "exact", head: true }).eq("stage_id", id);
  if (count && count > 0) {
    await adminClient.from("candidates").update({ stage_id: fallback.id }).eq("stage_id", id);
  }

  const { error } = await adminClient.from("candidate_stages").delete().eq("id", id);
  if (error) return { ok: false, reassignedCount: 0, error: error.message };
  return { ok: true, reassignedCount: count ?? 0 };
}

export async function addStageField(
  stageId: string,
  input: { labelAr: string; labelEn: string; fieldType: StageFieldType; options?: StageFieldOption[]; required?: boolean; fieldKey?: string }
): Promise<CandidateStageField | null> {
  const fieldKey = slugify(input.fieldKey || input.labelEn);
  if (!fieldKey) return null;

  const { data: maxRow } = await adminClient
    .from("candidate_stage_fields").select("sort_order").eq("stage_id", stageId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const nextOrder = (maxRow?.sort_order ?? -1) + 1;

  const { data, error } = await adminClient
    .from("candidate_stage_fields")
    .insert({
      stage_id: stageId, field_key: fieldKey, label_ar: input.labelAr, label_en: input.labelEn,
      field_type: input.fieldType, options: input.options ?? null, required: input.required ?? false, sort_order: nextOrder,
    })
    .select("*")
    .single();
  if (error || !data) return null;
  return toField(data as FieldRow);
}

export async function updateStageField(
  fieldId: string,
  patch: Partial<{ labelAr: string; labelEn: string; fieldType: StageFieldType; options: StageFieldOption[] | null; required: boolean }>
): Promise<boolean> {
  const update: Record<string, unknown> = {};
  if (patch.labelAr !== undefined) update.label_ar = patch.labelAr;
  if (patch.labelEn !== undefined) update.label_en = patch.labelEn;
  if (patch.fieldType !== undefined) update.field_type = patch.fieldType;
  if (patch.options !== undefined) update.options = patch.options;
  if (patch.required !== undefined) update.required = patch.required;
  if (Object.keys(update).length === 0) return true;

  const { error } = await adminClient.from("candidate_stage_fields").update(update).eq("id", fieldId);
  return !error;
}

export async function deleteStageField(fieldId: string): Promise<boolean> {
  const { error } = await adminClient.from("candidate_stage_fields").delete().eq("id", fieldId);
  return !error;
}
