// ─── Recruitment CRM service (SERVER ONLY) ───────────────────────────────────
// Mirrors features/leads/services/leads.service.ts closely — same dedupe,
// stage-move, assignment, and follow-up mechanics, applied to candidates.
// Callers (API routes) own their own requireAdmin()/requirePermission()
// check. Never import this from a "use client" file.

import { adminClient } from "@/lib/supabase/admin";
import { normalizeEmail, normalizeHandle, normalizePhone, normalizeText } from "@/lib/leads/normalize";
import { fetchDefaultStageId, fetchStageFields, fetchStageSummaries } from "@/features/candidates/services/candidate-stages.service";
import { fetchCategorySummaries } from "@/features/candidates/services/candidate-taxonomy.service";
import {
  CANDIDATE_ASSIGN_ACTION_TYPE,
  DEFAULT_FOLLOW_UP_DAYS,
  STAGE_CHANGE_ACTION_TYPE,
  type Candidate,
  type CandidateAction,
  type CandidateCategorySummary,
  type CandidateIdentityInput,
  type CandidateSource,
  type CandidateStageSummary,
  type CandidateWithActions,
  type CandidatesPageResult,
} from "@/features/candidates/types";

// ─── Row shapes + mapping ────────────────────────────────────────────────────

interface CandidateRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  social_handle: string | null;
  extra: Record<string, string> | null;
  stage_id: string | null;
  category_id: string | null;
  job_title: string | null;
  expected_salary: number | null;
  source: CandidateSource;
  assigned_to: string | null;
  created_by: string | null;
  possible_duplicate_of: string | null;
  created_at: string;
  updated_at: string;
}

interface CandidateActionRow {
  id: string;
  candidate_id: string;
  action_type: string;
  note: string | null;
  performed_by: string | null;
  follow_up_at: string | null;
  notified_at: string | null;
  stage_id: string | null;
  stage_answers: Record<string, string> | null;
  assigned_to: string | null;
  created_at: string;
}

async function namesFor(userIds: (string | null)[]): Promise<Record<string, string | null>> {
  const ids = Array.from(new Set(userIds.filter((id): id is string => !!id)));
  if (ids.length === 0) return {};
  const { data } = await adminClient.from("profiles").select("id, full_name").in("id", ids);
  return Object.fromEntries((data ?? []).map((p) => [p.id, p.full_name]));
}

async function fetchCategories(): Promise<Record<string, CandidateCategorySummary>> {
  return fetchCategorySummaries();
}

function toCandidate(row: CandidateRow, names: Record<string, string | null>, stages: Record<string, CandidateStageSummary>, categories: Record<string, CandidateCategorySummary>): Candidate {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    socialHandle: row.social_handle,
    extra: row.extra ?? {},
    stage: row.stage_id ? stages[row.stage_id] ?? null : null,
    category: row.category_id ? categories[row.category_id] ?? null : null,
    jobTitle: row.job_title,
    expectedSalary: row.expected_salary,
    source: row.source,
    assignedTo: row.assigned_to,
    assignedToName: row.assigned_to ? names[row.assigned_to] ?? null : null,
    createdBy: row.created_by,
    createdByName: row.created_by ? names[row.created_by] ?? null : null,
    possibleDuplicateOf: row.possible_duplicate_of,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toCandidateAction(row: CandidateActionRow, names: Record<string, string | null>, stages: Record<string, CandidateStageSummary>): CandidateAction {
  return {
    id: row.id,
    candidateId: row.candidate_id,
    actionType: row.action_type,
    note: row.note,
    performedBy: row.performed_by,
    performedByName: row.performed_by ? names[row.performed_by] ?? null : null,
    followUpAt: row.follow_up_at,
    notifiedAt: row.notified_at,
    stage: row.stage_id ? stages[row.stage_id] ?? null : null,
    stageAnswers: row.stage_answers,
    assignedTo: row.assigned_to,
    assignedToName: row.assigned_to ? names[row.assigned_to] ?? null : null,
    createdAt: row.created_at,
  };
}

// ─── Read ─────────────────────────────────────────────────────────────────

export interface CandidateFilterParams {
  stage?: string;
  category?: string;
  assignedTo?: string;
  /** Narrows to candidates with a candidate_actions row logged on this day
   *  (server's UTC calendar day). Combines with actionPersonId (AND). */
  actionDate?: string;
  /** Narrows to candidates with a candidate_actions row performed by this
   *  admin — distinct from `assignedTo` (who currently owns the record). */
  actionPersonId?: string;
}

function dayRangeUtc(dateStr: string): { start: string; end: string } {
  const start = new Date(`${dateStr}T00:00:00.000Z`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

/** Same reasoning as leads.service.ts's resolveActionFilterLeadIds. */
async function resolveActionFilterCandidateIds(actionDate?: string, actionPersonId?: string): Promise<string[] | null> {
  if (!actionDate && !actionPersonId) return null;

  let q = adminClient.from("candidate_actions").select("candidate_id");
  if (actionDate) {
    const range = dayRangeUtc(actionDate);
    q = q.gte("created_at", range.start).lt("created_at", range.end);
  }
  if (actionPersonId) q = q.eq("performed_by", actionPersonId);

  const { data } = await q;
  return Array.from(new Set((data ?? []).map((r) => r.candidate_id as string)));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyCandidateFilters(
  query: any,
  filters: CandidateFilterParams,
  stages: Record<string, CandidateStageSummary>,
  categories: Record<string, CandidateCategorySummary>,
  actionCandidateIds: string[] | null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): any | null {
  let q = query;
  if (filters.stage && filters.stage !== "all") {
    const match = Object.values(stages).find((s) => s.key === filters.stage);
    if (!match) return null;
    q = q.eq("stage_id", match.id);
  }
  if (filters.category) {
    const match = Object.values(categories).find((c) => c.key === filters.category);
    if (!match) return null;
    q = q.eq("category_id", match.id);
  }
  if (filters.assignedTo) {
    q = q.eq("assigned_to", filters.assignedTo);
  }
  if (actionCandidateIds !== null) {
    if (actionCandidateIds.length === 0) return null;
    q = q.in("id", actionCandidateIds);
  }
  return q;
}

// Real columns on `candidates` — every table header maps to one of these.
// stage_id / category_id / assigned_to sort by grouping (the FK value), not
// by label, which is what "sort by stage/category/owner" means in practice.
export const CANDIDATE_SORT_KEYS = [
  "full_name", "phone", "email", "job_title", "expected_salary",
  "stage_id", "category_id", "assigned_to", "created_at",
] as const;
export type CandidateSortKey = (typeof CANDIDATE_SORT_KEYS)[number];
const SORTABLE = new Set<string>(CANDIDATE_SORT_KEYS);

export interface CandidatesPageParams extends CandidateFilterParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  dir?: "asc" | "desc";
}

export async function fetchCandidatesPage({ page = 1, pageSize = 10, sort, dir, ...filters }: CandidatesPageParams): Promise<CandidatesPageResult> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const [stages, categories, actionCandidateIds] = await Promise.all([
    fetchStageSummaries(), fetchCategories(), resolveActionFilterCandidateIds(filters.actionDate, filters.actionPersonId),
  ]);

  const sortCol = sort && SORTABLE.has(sort) ? sort : "created_at";
  // No explicit sort ⇒ newest first (unchanged default). An explicit sort
  // defaults to ascending unless dir says otherwise.
  const ascending = sort ? dir !== "desc" : false;

  const base = adminClient
    .from("candidates")
    .select("*", { count: "exact" })
    .order(sortCol, { ascending, nullsFirst: false })
    .order("id", { ascending: true }) // stable tiebreak within equal sort values
    .range(from, to);

  const query = applyCandidateFilters(base, filters, stages, categories, actionCandidateIds);
  if (!query) return { candidates: [], total: 0 };

  const { data, count, error } = await query;
  if (error || !data) return { candidates: [], total: 0 };

  const rows = data as CandidateRow[];
  const names = await namesFor(rows.flatMap((r) => [r.assigned_to, r.created_by]));
  return { candidates: rows.map((r) => toCandidate(r, names, stages, categories)), total: count ?? 0 };
}

/** All candidates, unpaginated — backs the board view. */
export async function fetchAllCandidatesForBoard(filters: Omit<CandidateFilterParams, "stage"> = {}): Promise<Candidate[]> {
  const [stages, categories, actionCandidateIds] = await Promise.all([
    fetchStageSummaries(), fetchCategories(), resolveActionFilterCandidateIds(filters.actionDate, filters.actionPersonId),
  ]);
  const base = adminClient.from("candidates").select("*").order("created_at", { ascending: false });
  const query = applyCandidateFilters(base, filters, stages, categories, actionCandidateIds);
  if (!query) return [];

  const { data, error } = await query;
  if (error || !data) return [];
  const rows = data as CandidateRow[];
  const names = await namesFor(rows.flatMap((r) => [r.assigned_to, r.created_by]));
  return rows.map((r) => toCandidate(r, names, stages, categories));
}

export async function fetchCandidateById(id: string): Promise<CandidateWithActions | null> {
  const { data: candidateRow, error } = await adminClient.from("candidates").select("*").eq("id", id).single();
  if (error || !candidateRow) return null;

  const [{ data: actionRows }, stages, categories] = await Promise.all([
    adminClient.from("candidate_actions").select("*").eq("candidate_id", id).order("created_at", { ascending: false }),
    fetchStageSummaries(),
    fetchCategories(),
  ]);

  const row = candidateRow as CandidateRow;
  const actions = (actionRows ?? []) as CandidateActionRow[];
  const names = await namesFor([row.assigned_to, row.created_by, ...actions.map((a) => a.performed_by), ...actions.map((a) => a.assigned_to)]);

  return {
    ...toCandidate(row, names, stages, categories),
    actions: actions.map((a) => toCandidateAction(a, names, stages)),
  };
}

// ─── Dedupe + create ──────────────────────────────────────────────────────

interface CreateCandidateResult {
  candidate: Candidate;
  merged: boolean;
  flaggedDuplicate: boolean;
}

/** Same email/phone dedupe rules as createLead — see leads.service.ts's doc
 *  comment for the reasoning (shared phone numbers get recycled, so only
 *  email auto-merges; phone alone just flags for manual review). */
export async function createCandidate(
  input: CandidateIdentityInput,
  createdBy: string | null,
  source: CandidateSource,
  extraFields?: { categoryId?: string | null; jobTitle?: string | null; expectedSalary?: number | null }
): Promise<CreateCandidateResult> {
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);
  const socialHandle = normalizeHandle(input.socialHandle);
  const fullName = normalizeText(input.fullName);
  const extra = input.extra ?? {};
  const [stages, categories] = await Promise.all([fetchStageSummaries(), fetchCategories()]);

  if (email) {
    const { data: existing } = await adminClient.from("candidates").select("*").eq("email", email).limit(1).maybeSingle();
    if (existing) {
      const row = existing as CandidateRow;
      const { data: updated } = await adminClient
        .from("candidates")
        .update({
          full_name: row.full_name ?? fullName,
          phone: row.phone ?? phone,
          social_handle: row.social_handle ?? socialHandle,
          extra: { ...(row.extra ?? {}), ...extra },
          category_id: row.category_id ?? extraFields?.categoryId ?? null,
          job_title: row.job_title ?? extraFields?.jobTitle ?? null,
          expected_salary: row.expected_salary ?? extraFields?.expectedSalary ?? null,
        })
        .eq("id", row.id)
        .select("*")
        .single();
      const merged = (updated ?? row) as CandidateRow;
      const names = await namesFor([merged.assigned_to, merged.created_by]);
      return { candidate: toCandidate(merged, names, stages, categories), merged: true, flaggedDuplicate: false };
    }
  }

  let possibleDuplicateOf: string | null = null;
  if (phone) {
    const { data: existingByPhone } = await adminClient
      .from("candidates")
      .select("id")
      .eq("phone", phone)
      .limit(1)
      .maybeSingle();
    possibleDuplicateOf = existingByPhone?.id ?? null;
  }

  const defaultStageId = await fetchDefaultStageId();

  const { data: created, error } = await adminClient
    .from("candidates")
    .insert({
      full_name: fullName,
      phone,
      email,
      social_handle: socialHandle,
      extra,
      stage_id: defaultStageId,
      category_id: extraFields?.categoryId ?? null,
      job_title: extraFields?.jobTitle ?? null,
      expected_salary: extraFields?.expectedSalary ?? null,
      source,
      assigned_to: createdBy,
      created_by: createdBy,
      possible_duplicate_of: possibleDuplicateOf,
    })
    .select("*")
    .single();

  if (error || !created) {
    throw new Error(error?.message ?? "failed to create candidate");
  }

  const row = created as CandidateRow;
  const names = await namesFor([row.assigned_to, row.created_by]);
  return { candidate: toCandidate(row, names, stages, categories), merged: false, flaggedDuplicate: !!possibleDuplicateOf };
}

export interface ImportSummary {
  total: number;
  created: number;
  merged: number;
  flaggedDuplicate: number;
  failed: number;
}

/** Bulk entry point for Excel/Sheet import — sequential so two rows sharing
 *  an email in the same file correctly merge into each other.
 *
 *  `onProgress` fires once per processed row (after each `createCandidate`);
 *  the import/route.ts streams these out as NDJSON so the admin UI can show
 *  a real "X / total" progress bar instead of a spinner. */
export async function importCandidates(
  rows: (CandidateIdentityInput & { jobTitle?: string | null; expectedSalary?: number | null })[],
  createdBy: string | null,
  source: CandidateSource,
  onProgress?: (processed: number, total: number) => void
): Promise<ImportSummary> {
  const summary: ImportSummary = { total: rows.length, created: 0, merged: 0, flaggedDuplicate: 0, failed: 0 };
  let processed = 0;
  for (const row of rows) {
    if (!row.fullName && !row.phone && !row.email && !row.socialHandle && Object.keys(row.extra ?? {}).length === 0) {
      summary.failed++;
    } else {
      try {
        const result = await createCandidate(row, createdBy, source, { jobTitle: row.jobTitle, expectedSalary: row.expectedSalary });
        if (result.merged) summary.merged++;
        else summary.created++;
        if (result.flaggedDuplicate) summary.flaggedDuplicate++;
      } catch {
        summary.failed++;
      }
    }
    processed++;
    onProgress?.(processed, rows.length);
  }
  return summary;
}

// ─── Mutations ────────────────────────────────────────────────────────────

export async function updateCandidateIdentity(
  candidateId: string,
  input: Partial<{ fullName: string | null; phone: string | null; email: string | null; socialHandle: string | null }>
): Promise<boolean> {
  const patch: Record<string, string | null> = {};
  if ("fullName" in input) patch.full_name = normalizeText(input.fullName);
  if ("phone" in input) patch.phone = normalizePhone(input.phone);
  if ("email" in input) patch.email = normalizeEmail(input.email);
  if ("socialHandle" in input) patch.social_handle = normalizeHandle(input.socialHandle);
  if (Object.keys(patch).length === 0) return true;

  const { error } = await adminClient.from("candidates").update(patch).eq("id", candidateId);
  return !error;
}

/** Sets/clears category + job title + expected salary — the recruitment
 *  equivalent of updateLeadTaxonomy, just with two extra plain fields. */
export async function updateCandidateFields(
  candidateId: string,
  input: Partial<{ categoryId: string | null; jobTitle: string | null; expectedSalary: number | null }>
): Promise<boolean> {
  const patch: Record<string, string | number | null> = {};
  if ("categoryId" in input) patch.category_id = input.categoryId ?? null;
  if ("jobTitle" in input) patch.job_title = input.jobTitle ?? null;
  if ("expectedSalary" in input) patch.expected_salary = input.expectedSalary ?? null;
  if (Object.keys(patch).length === 0) return true;

  const { error } = await adminClient.from("candidates").update(patch).eq("id", candidateId);
  return !error;
}

export async function reassignCandidate(candidateId: string, assignedTo: string | null, performedBy: string | null): Promise<boolean> {
  const { error } = await adminClient.from("candidates").update({ assigned_to: assignedTo }).eq("id", candidateId);
  if (error) return false;

  const { error: actionError } = await adminClient.from("candidate_actions").insert({
    candidate_id: candidateId,
    action_type: CANDIDATE_ASSIGN_ACTION_TYPE,
    performed_by: performedBy,
    assigned_to: assignedTo,
    follow_up_at: null,
  });
  if (actionError) {
    console.error("[candidates] reassignCandidate: history insert failed:", actionError.message);
  }
  return true;
}

export interface BulkReassignResult {
  succeeded: number;
  failed: number;
}

export async function bulkReassignCandidates(candidateIds: string[], assignedTo: string | null, performedBy: string | null): Promise<BulkReassignResult> {
  const results = await Promise.all(candidateIds.map((id) => reassignCandidate(id, assignedTo, performedBy)));
  return {
    succeeded: results.filter(Boolean).length,
    failed: results.filter((ok) => !ok).length,
  };
}

/** `candidate_actions` rows cascade-delete with the candidate. */
export async function deleteCandidate(candidateId: string): Promise<boolean> {
  const { error } = await adminClient.from("candidates").delete().eq("id", candidateId);
  return !error;
}

export async function resolveDuplicate(candidateId: string, decision: "merge" | "dismiss"): Promise<boolean> {
  const { data: candidateRow } = await adminClient.from("candidates").select("*").eq("id", candidateId).single();
  const row = candidateRow as CandidateRow | null;
  if (!row?.possible_duplicate_of) return false;

  if (decision === "dismiss") {
    const { error } = await adminClient.from("candidates").update({ possible_duplicate_of: null }).eq("id", candidateId);
    return !error;
  }

  const targetId = row.possible_duplicate_of;
  const { data: targetRow } = await adminClient.from("candidates").select("*").eq("id", targetId).single();
  const target = targetRow as CandidateRow | null;
  if (!target) return false;

  await adminClient.from("candidate_actions").update({ candidate_id: targetId }).eq("candidate_id", candidateId);
  await adminClient
    .from("candidates")
    .update({
      full_name: target.full_name ?? row.full_name,
      phone: target.phone ?? row.phone,
      social_handle: target.social_handle ?? row.social_handle,
      email: target.email ?? row.email,
      extra: { ...(row.extra ?? {}), ...(target.extra ?? {}) },
      category_id: target.category_id ?? row.category_id,
      job_title: target.job_title ?? row.job_title,
      expected_salary: target.expected_salary ?? row.expected_salary,
    })
    .eq("id", targetId);
  const { error } = await adminClient.from("candidates").delete().eq("id", candidateId);
  return !error;
}

export interface AddCandidateActionInput {
  actionType: string;
  note?: string | null;
  performedBy: string | null;
  followUpAt?: string | null;
  assignedTo?: string | null;
}

export async function addCandidateAction(candidateId: string, input: AddCandidateActionInput): Promise<CandidateAction | null> {
  const followUpAt =
    input.followUpAt ?? new Date(Date.now() + DEFAULT_FOLLOW_UP_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await adminClient
    .from("candidate_actions")
    .insert({
      candidate_id: candidateId,
      action_type: input.actionType,
      note: input.note ?? null,
      performed_by: input.performedBy,
      follow_up_at: followUpAt,
      assigned_to: input.assignedTo ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[candidates] addCandidateAction failed:", error?.message);
    return null;
  }

  const [names, stages] = await Promise.all([namesFor([data.performed_by, data.assigned_to]), fetchStageSummaries()]);
  return toCandidateAction(data as CandidateActionRow, names, stages);
}

export async function updateActionFollowUp(actionId: string, followUpAt: string | null): Promise<boolean> {
  const { error } = await adminClient
    .from("candidate_actions")
    .update({ follow_up_at: followUpAt, notified_at: null })
    .eq("id", actionId);
  return !error;
}

// ─── Move a candidate to a different stage ─────────────────────────────────

export interface MoveStageResult {
  ok: boolean;
  error?: string;
  action?: CandidateAction;
}

export async function moveCandidateStage(
  candidateId: string,
  stageId: string,
  input: { answers?: Record<string, string>; followUpAt?: string | null; performedBy: string | null }
): Promise<MoveStageResult> {
  const fields = await fetchStageFields(stageId);
  const answers = input.answers ?? {};

  const missing = fields.filter((f) => f.required && !answers[f.fieldKey]?.trim());
  if (missing.length > 0) {
    return { ok: false, error: `missing required field: ${missing[0].fieldKey}` };
  }

  const { error: updateError } = await adminClient.from("candidates").update({ stage_id: stageId }).eq("id", candidateId);
  if (updateError) return { ok: false, error: updateError.message };

  const followUpAt =
    input.followUpAt ?? new Date(Date.now() + DEFAULT_FOLLOW_UP_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await adminClient
    .from("candidate_actions")
    .insert({
      candidate_id: candidateId,
      action_type: STAGE_CHANGE_ACTION_TYPE,
      performed_by: input.performedBy,
      follow_up_at: followUpAt,
      stage_id: stageId,
      stage_answers: Object.keys(answers).length > 0 ? answers : null,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[candidates] moveCandidateStage: stage_change action insert failed:", error?.message);
    return { ok: true };
  }

  const [names, stages] = await Promise.all([namesFor([data.performed_by]), fetchStageSummaries()]);
  return { ok: true, action: toCandidateAction(data as CandidateActionRow, names, stages) };
}

// ─── Follow-up reminder scan (backs the daily cron check) ────────────────

export interface DueFollowUp {
  actionId: string;
  candidateId: string;
  candidateName: string | null;
  performedBy: string | null;
  assignedTo: string | null;
  followUpAt: string;
}

export async function fetchDueFollowUps(): Promise<DueFollowUp[]> {
  const nowIso = new Date().toISOString();
  const { data: actions } = await adminClient
    .from("candidate_actions")
    .select("id, candidate_id, performed_by, follow_up_at, assigned_to")
    .lte("follow_up_at", nowIso)
    .is("notified_at", null);

  if (!actions?.length) return [];

  const candidateIds = Array.from(new Set(actions.map((a) => a.candidate_id)));
  const { data: candidates } = await adminClient.from("candidates").select("id, full_name, assigned_to").in("id", candidateIds);
  const candidateById = Object.fromEntries((candidates ?? []).map((c) => [c.id, c]));

  return actions.map((a) => ({
    actionId: a.id,
    candidateId: a.candidate_id,
    candidateName: candidateById[a.candidate_id]?.full_name ?? null,
    performedBy: a.performed_by,
    assignedTo: a.assigned_to ?? candidateById[a.candidate_id]?.assigned_to ?? null,
    followUpAt: a.follow_up_at as string,
  }));
}

export async function markActionsNotified(actionIds: string[]): Promise<void> {
  if (actionIds.length === 0) return;
  await adminClient.from("candidate_actions").update({ notified_at: new Date().toISOString() }).in("id", actionIds);
}
