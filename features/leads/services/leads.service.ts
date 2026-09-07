// ─── Leads CRM service (SERVER ONLY) ─────────────────────────────────────────
// Every write goes through the service role — callers (API routes) are
// responsible for their own requireAdmin() check, same as every other admin
// service in features/admin/services/admin.service.ts. Never import this
// from a "use client" file.

import { adminClient } from "@/lib/supabase/admin";
import { normalizeEmail, normalizeHandle, normalizePhone, normalizeText } from "@/lib/leads/normalize";
import { fetchDefaultStageId, fetchStageFields, fetchStageSummaries } from "@/features/leads/services/lead-stages.service";
import { fetchTermSummaries } from "@/features/leads/services/lead-taxonomy.service";
import {
  DEFAULT_FOLLOW_UP_DAYS,
  LEAD_ASSIGN_ACTION_TYPE,
  STAGE_CHANGE_ACTION_TYPE,
  type Lead,
  type LeadAction,
  type LeadIdentityInput,
  type LeadSource,
  type LeadStageSummary,
  type LeadTaxonomySummary,
  type LeadWithActions,
  type LeadsPageResult,
} from "@/features/leads/types";

// ─── Row shapes + mapping ────────────────────────────────────────────────────

interface LeadRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  social_handle: string | null;
  extra: Record<string, string> | null;
  stage_id: string | null;
  channel_id: string | null;
  category_id: string | null;
  source: LeadSource;
  assigned_to: string | null;
  created_by: string | null;
  possible_duplicate_of: string | null;
  created_at: string;
  updated_at: string;
}

interface LeadActionRow {
  id: string;
  lead_id: string;
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

interface Taxonomies {
  channels: Record<string, LeadTaxonomySummary>;
  categories: Record<string, LeadTaxonomySummary>;
}

async function fetchTaxonomies(): Promise<Taxonomies> {
  const [channels, categories] = await Promise.all([
    fetchTermSummaries("lead_channels"),
    fetchTermSummaries("lead_categories"),
  ]);
  return { channels, categories };
}

function toLead(row: LeadRow, names: Record<string, string | null>, stages: Record<string, LeadStageSummary>, taxonomies: Taxonomies): Lead {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    socialHandle: row.social_handle,
    extra: row.extra ?? {},
    stage: row.stage_id ? stages[row.stage_id] ?? null : null,
    channel: row.channel_id ? taxonomies.channels[row.channel_id] ?? null : null,
    category: row.category_id ? taxonomies.categories[row.category_id] ?? null : null,
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

function toLeadAction(row: LeadActionRow, names: Record<string, string | null>, stages: Record<string, LeadStageSummary>): LeadAction {
  return {
    id: row.id,
    leadId: row.lead_id,
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

/** Shared by fetchLeadsPage and fetchAllLeadsForBoard — `channel`/`category`
 *  are `key` slugs (same reasoning as `stage`: a filtered link stays
 *  readable and stable across a reseed); `assignedTo` is a raw profile id
 *  since there's no equivalent stable slug for an admin. */
export interface LeadFilterParams {
  /** A stage `key` (e.g. "new"), or "all"/undefined for no filter. */
  stage?: string;
  channel?: string;
  category?: string;
  assignedTo?: string;
}

/** Returns null if a filter names a channel/category/stage key that no
 *  longer exists — the caller should short-circuit to an empty result
 *  rather than silently ignore an unmatched filter. Loosely typed (`any`)
 *  like the rest of this codebase's Supabase query chains — see CLAUDE.md
 *  §12 on `tsconfig.strict: false`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyLeadFilters(
  query: any,
  filters: LeadFilterParams,
  stages: Record<string, LeadStageSummary>,
  taxonomies: Taxonomies
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): any | null {
  let q = query;

  if (filters.stage && filters.stage !== "all") {
    const match = Object.values(stages).find((s) => s.key === filters.stage);
    if (!match) return null;
    q = q.eq("stage_id", match.id);
  }
  if (filters.channel) {
    const match = Object.values(taxonomies.channels).find((c) => c.key === filters.channel);
    if (!match) return null;
    q = q.eq("channel_id", match.id);
  }
  if (filters.category) {
    const match = Object.values(taxonomies.categories).find((c) => c.key === filters.category);
    if (!match) return null;
    q = q.eq("category_id", match.id);
  }
  if (filters.assignedTo) {
    q = q.eq("assigned_to", filters.assignedTo);
  }
  return q;
}

export interface LeadsPageParams extends LeadFilterParams {
  page?: number;
  pageSize?: number;
}

export async function fetchLeadsPage({ page = 1, pageSize = 10, ...filters }: LeadsPageParams): Promise<LeadsPageResult> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const [stages, taxonomies] = await Promise.all([fetchStageSummaries(), fetchTaxonomies()]);

  const base = adminClient
    .from("leads")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  const query = applyLeadFilters(base, filters, stages, taxonomies);
  if (!query) return { leads: [], total: 0 };

  const { data, count, error } = await query;
  if (error || !data) return { leads: [], total: 0 };

  const rows = data as LeadRow[];
  const names = await namesFor(rows.flatMap((r) => [r.assigned_to, r.created_by]));
  return { leads: rows.map((r) => toLead(r, names, stages, taxonomies)), total: count ?? 0 };
}

/** All leads, unpaginated, grouped-ready — backs the board view (every
 *  column needs its full card list at once, not one page at a time).
 *  `stage` is never passed here — the board shows every stage as its own
 *  column, so filtering it out client-side would be pointless. */
export async function fetchAllLeadsForBoard(filters: Omit<LeadFilterParams, "stage"> = {}): Promise<Lead[]> {
  const [stages, taxonomies] = await Promise.all([fetchStageSummaries(), fetchTaxonomies()]);
  const base = adminClient.from("leads").select("*").order("created_at", { ascending: false });
  const query = applyLeadFilters(base, filters, stages, taxonomies);
  if (!query) return [];

  const { data, error } = await query;
  if (error || !data) return [];
  const rows = data as LeadRow[];
  const names = await namesFor(rows.flatMap((r) => [r.assigned_to, r.created_by]));
  return rows.map((r) => toLead(r, names, stages, taxonomies));
}


export async function fetchLeadById(id: string): Promise<LeadWithActions | null> {
  const { data: leadRow, error } = await adminClient.from("leads").select("*").eq("id", id).single();
  if (error || !leadRow) return null;

  const [{ data: actionRows }, stages, taxonomies] = await Promise.all([
    adminClient.from("lead_actions").select("*").eq("lead_id", id).order("created_at", { ascending: false }),
    fetchStageSummaries(),
    fetchTaxonomies(),
  ]);

  const row = leadRow as LeadRow;
  const actions = (actionRows ?? []) as LeadActionRow[];
  const names = await namesFor([row.assigned_to, row.created_by, ...actions.map((a) => a.performed_by), ...actions.map((a) => a.assigned_to)]);

  return {
    ...toLead(row, names, stages, taxonomies),
    actions: actions.map((a) => toLeadAction(a, names, stages)),
  };
}

// ─── Dedupe + create ──────────────────────────────────────────────────────

interface CreateLeadResult {
  lead: Lead;
  merged: boolean;
  flaggedDuplicate: boolean;
}

/**
 * Same email as an existing lead -> merge into it (fill in blanks, union
 * `extra`, never overwrite a non-null value with a different one). Same
 * phone but no email match -> a NEW row, flagged via
 * `possible_duplicate_of` for manual review — a shared phone number is a
 * hint, not proof of the same person (numbers get recycled/shared), so it
 * never auto-merges. See supabase/migrations/20260906_leads_crm.sql.
 */
export async function createLead(
  input: LeadIdentityInput,
  createdBy: string | null,
  source: LeadSource,
  /** Optional at creation time — set from the manual "add lead" form; excel/sheet
   *  imports normally leave these unset and the admin tags leads afterward. */
  taxonomy?: { channelId?: string | null; categoryId?: string | null }
): Promise<CreateLeadResult> {
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);
  const socialHandle = normalizeHandle(input.socialHandle);
  const fullName = normalizeText(input.fullName);
  const extra = input.extra ?? {};
  const [stages, taxonomies] = await Promise.all([fetchStageSummaries(), fetchTaxonomies()]);

  if (email) {
    const { data: existing } = await adminClient.from("leads").select("*").eq("email", email).limit(1).maybeSingle();
    if (existing) {
      const row = existing as LeadRow;
      const { data: updated } = await adminClient
        .from("leads")
        .update({
          full_name: row.full_name ?? fullName,
          phone: row.phone ?? phone,
          social_handle: row.social_handle ?? socialHandle,
          extra: { ...(row.extra ?? {}), ...extra },
          channel_id: row.channel_id ?? taxonomy?.channelId ?? null,
          category_id: row.category_id ?? taxonomy?.categoryId ?? null,
        })
        .eq("id", row.id)
        .select("*")
        .single();
      const merged = (updated ?? row) as LeadRow;
      const names = await namesFor([merged.assigned_to, merged.created_by]);
      return { lead: toLead(merged, names, stages, taxonomies), merged: true, flaggedDuplicate: false };
    }
  }

  let possibleDuplicateOf: string | null = null;
  if (phone) {
    const { data: existingByPhone } = await adminClient
      .from("leads")
      .select("id")
      .eq("phone", phone)
      .limit(1)
      .maybeSingle();
    possibleDuplicateOf = existingByPhone?.id ?? null;
  }

  const defaultStageId = await fetchDefaultStageId();

  const { data: created, error } = await adminClient
    .from("leads")
    .insert({
      full_name: fullName,
      phone,
      email,
      social_handle: socialHandle,
      extra,
      stage_id: defaultStageId,
      channel_id: taxonomy?.channelId ?? null,
      category_id: taxonomy?.categoryId ?? null,
      source,
      assigned_to: createdBy,
      created_by: createdBy,
      possible_duplicate_of: possibleDuplicateOf,
    })
    .select("*")
    .single();

  if (error || !created) {
    throw new Error(error?.message ?? "failed to create lead");
  }

  const row = created as LeadRow;
  const names = await namesFor([row.assigned_to, row.created_by]);
  return { lead: toLead(row, names, stages, taxonomies), merged: false, flaggedDuplicate: !!possibleDuplicateOf };
}

export interface ImportSummary {
  total: number;
  created: number;
  merged: number;
  flaggedDuplicate: number;
  failed: number;
}

/** Bulk entry point for Excel/Sheet import — same createLead logic per row,
 *  sequential (not Promise.all) so two rows in the same file that share an
 *  email correctly merge into each other instead of racing. */
export async function importLeads(
  rows: LeadIdentityInput[],
  createdBy: string | null,
  source: LeadSource
): Promise<ImportSummary> {
  const summary: ImportSummary = { total: rows.length, created: 0, merged: 0, flaggedDuplicate: 0, failed: 0 };
  for (const row of rows) {
    // A row with literally nothing usable isn't a lead.
    if (!row.fullName && !row.phone && !row.email && !row.socialHandle && Object.keys(row.extra ?? {}).length === 0) {
      summary.failed++;
      continue;
    }
    try {
      const result = await createLead(row, createdBy, source);
      if (result.merged) summary.merged++;
      else summary.created++;
      if (result.flaggedDuplicate) summary.flaggedDuplicate++;
    } catch {
      summary.failed++;
    }
  }
  return summary;
}

// ─── Mutations ────────────────────────────────────────────────────────────

/** Corrects the identity fields collected on a lead — the whole point of
 *  this CRM is accepting messy data on the way in, so a typo'd phone or a
 *  handle filled in later needs to be fixable afterwards. Only the fields
 *  actually passed are touched; omit one to leave it as-is. */
export async function updateLeadIdentity(
  leadId: string,
  input: Partial<{ fullName: string | null; phone: string | null; email: string | null; socialHandle: string | null }>
): Promise<boolean> {
  const patch: Record<string, string | null> = {};
  if ("fullName" in input) patch.full_name = normalizeText(input.fullName);
  if ("phone" in input) patch.phone = normalizePhone(input.phone);
  if ("email" in input) patch.email = normalizeEmail(input.email);
  if ("socialHandle" in input) patch.social_handle = normalizeHandle(input.socialHandle);
  if (Object.keys(patch).length === 0) return true;

  const { error } = await adminClient.from("leads").update(patch).eq("id", leadId);
  return !error;
}

/** Sets/clears the channel + category tags — separate from updateLeadIdentity
 *  since these aren't messy free-text identity fields, just a picker. Pass
 *  `null` to explicitly clear one, omit a key to leave it as-is. */
export async function updateLeadTaxonomy(
  leadId: string,
  input: Partial<{ channelId: string | null; categoryId: string | null }>
): Promise<boolean> {
  const patch: Record<string, string | null> = {};
  if ("channelId" in input) patch.channel_id = input.channelId ?? null;
  if ("categoryId" in input) patch.category_id = input.categoryId ?? null;
  if (Object.keys(patch).length === 0) return true;

  const { error } = await adminClient.from("leads").update(patch).eq("id", leadId);
  return !error;
}

/** Reassigns who owns a lead — always logs a `lead_assigned` history entry
 *  (same "never a silent column update" rule as moveLeadStage), so the
 *  timeline shows who handed it to whom and when. `assignedTo: null` clears
 *  ownership entirely (unassigned). */
export async function reassignLead(leadId: string, assignedTo: string | null, performedBy: string | null): Promise<boolean> {
  const { error } = await adminClient.from("leads").update({ assigned_to: assignedTo }).eq("id", leadId);
  if (error) return false;

  const { error: actionError } = await adminClient.from("lead_actions").insert({
    lead_id: leadId,
    action_type: LEAD_ASSIGN_ACTION_TYPE,
    performed_by: performedBy,
    assigned_to: assignedTo,
    follow_up_at: null,
  });
  if (actionError) {
    // The reassignment itself already happened — logging it is best-effort
    // on top, same posture as moveLeadStage's own history insert.
    console.error("[leads] reassignLead: history insert failed:", actionError.message);
  }
  return true;
}

export interface BulkReassignResult {
  succeeded: number;
  failed: number;
}

/** Same as reassignLead, applied to many leads at once — backs the leads
 *  table's "select one or a group, assign them all" bulk action. Sequential
 *  isn't needed here (unlike importLeads' dedupe race) since each lead is
 *  independent, so these run in parallel. */
export async function bulkReassignLeads(leadIds: string[], assignedTo: string | null, performedBy: string | null): Promise<BulkReassignResult> {
  const results = await Promise.all(leadIds.map((id) => reassignLead(id, assignedTo, performedBy)));
  return {
    succeeded: results.filter(Boolean).length,
    failed: results.filter((ok) => !ok).length,
  };
}

/** `lead_actions` rows cascade-delete with the lead (ON DELETE CASCADE, see
 *  the migration) — nothing extra to clean up here. */
export async function deleteLead(leadId: string): Promise<boolean> {
  const { error } = await adminClient.from("leads").delete().eq("id", leadId);
  return !error;
}

/** Clears the duplicate flag either way: `merge` folds the newer lead's
 *  actions onto the original and deletes the newer row; `dismiss` just
 *  clears the flag, keeping both leads as distinct people. */
export async function resolveDuplicate(leadId: string, decision: "merge" | "dismiss"): Promise<boolean> {
  const { data: leadRow } = await adminClient.from("leads").select("*").eq("id", leadId).single();
  const row = leadRow as LeadRow | null;
  if (!row?.possible_duplicate_of) return false;

  if (decision === "dismiss") {
    const { error } = await adminClient.from("leads").update({ possible_duplicate_of: null }).eq("id", leadId);
    return !error;
  }

  const targetId = row.possible_duplicate_of;
  const { data: targetRow } = await adminClient.from("leads").select("*").eq("id", targetId).single();
  const target = targetRow as LeadRow | null;
  if (!target) return false;

  await adminClient.from("lead_actions").update({ lead_id: targetId }).eq("lead_id", leadId);
  await adminClient
    .from("leads")
    .update({
      full_name: target.full_name ?? row.full_name,
      phone: target.phone ?? row.phone,
      social_handle: target.social_handle ?? row.social_handle,
      email: target.email ?? row.email,
      extra: { ...(row.extra ?? {}), ...(target.extra ?? {}) },
      channel_id: target.channel_id ?? row.channel_id,
      category_id: target.category_id ?? row.category_id,
    })
    .eq("id", targetId);
  const { error } = await adminClient.from("leads").delete().eq("id", leadId);
  return !error;
}

export interface AddLeadActionInput {
  actionType: string;
  note?: string | null;
  performedBy: string | null;
  /** ISO timestamp. Defaults to now + DEFAULT_FOLLOW_UP_DAYS when omitted. */
  followUpAt?: string | null;
  /** Who this specific task is for — defaults to nothing (not the lead's
   *  owner) if omitted; the caller (UI) is expected to pre-fill it with the
   *  lead's current assignedTo when it wants that default. */
  assignedTo?: string | null;
}

export async function addLeadAction(leadId: string, input: AddLeadActionInput): Promise<LeadAction | null> {
  const followUpAt =
    input.followUpAt ?? new Date(Date.now() + DEFAULT_FOLLOW_UP_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await adminClient
    .from("lead_actions")
    .insert({
      lead_id: leadId,
      action_type: input.actionType,
      note: input.note ?? null,
      performed_by: input.performedBy,
      follow_up_at: followUpAt,
      assigned_to: input.assignedTo ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[leads] addLeadAction failed:", error?.message);
    return null;
  }

  const [names, stages] = await Promise.all([namesFor([data.performed_by, data.assigned_to]), fetchStageSummaries()]);
  return toLeadAction(data as LeadActionRow, names, stages);
}

/** Editable by the action's own author or any other admin — no ownership
 *  check here beyond "is this caller an admin" (enforced by the route). */
export async function updateActionFollowUp(actionId: string, followUpAt: string | null): Promise<boolean> {
  const { error } = await adminClient
    .from("lead_actions")
    .update({ follow_up_at: followUpAt, notified_at: null })
    .eq("id", actionId);
  return !error;
}

// ─── Move a lead to a different stage ──────────────────────────────────────

export interface MoveStageResult {
  ok: boolean;
  error?: string;
  action?: LeadAction;
}

/**
 * The one path that changes `leads.stage_id` — used by both the board's
 * drag-and-drop and the detail page's stage picker, so a move always
 * produces a `stage_change` lead_action (full history, not just a silent
 * column update) and always validates the target stage's own required
 * questions before committing.
 */
export async function moveLeadStage(
  leadId: string,
  stageId: string,
  input: { answers?: Record<string, string>; followUpAt?: string | null; performedBy: string | null }
): Promise<MoveStageResult> {
  const fields = await fetchStageFields(stageId);
  const answers = input.answers ?? {};

  const missing = fields.filter((f) => f.required && !answers[f.fieldKey]?.trim());
  if (missing.length > 0) {
    return { ok: false, error: `missing required field: ${missing[0].fieldKey}` };
  }

  const { error: updateError } = await adminClient.from("leads").update({ stage_id: stageId }).eq("id", leadId);
  if (updateError) return { ok: false, error: updateError.message };

  const followUpAt =
    input.followUpAt ?? new Date(Date.now() + DEFAULT_FOLLOW_UP_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await adminClient
    .from("lead_actions")
    .insert({
      lead_id: leadId,
      action_type: STAGE_CHANGE_ACTION_TYPE,
      performed_by: input.performedBy,
      follow_up_at: followUpAt,
      stage_id: stageId,
      stage_answers: Object.keys(answers).length > 0 ? answers : null,
    })
    .select("*")
    .single();

  if (error || !data) {
    // The stage itself already moved — logging the history entry is
    // best-effort on top of that, same posture as notifications/email.
    console.error("[leads] moveLeadStage: stage_change action insert failed:", error?.message);
    return { ok: true };
  }

  const [names, stages] = await Promise.all([namesFor([data.performed_by]), fetchStageSummaries()]);
  return { ok: true, action: toLeadAction(data as LeadActionRow, names, stages) };
}

// ─── Follow-up reminder scan (backs the daily cron check) ────────────────

export interface DueFollowUp {
  actionId: string;
  leadId: string;
  leadName: string | null;
  performedBy: string | null;
  assignedTo: string | null;
  followUpAt: string;
}

/** Actions whose follow-up date has arrived and haven't been notified yet. */
export async function fetchDueFollowUps(): Promise<DueFollowUp[]> {
  const nowIso = new Date().toISOString();
  const { data: actions } = await adminClient
    .from("lead_actions")
    .select("id, lead_id, performed_by, follow_up_at, assigned_to")
    .lte("follow_up_at", nowIso)
    .is("notified_at", null);

  if (!actions?.length) return [];

  const leadIds = Array.from(new Set(actions.map((a) => a.lead_id)));
  const { data: leads } = await adminClient.from("leads").select("id, full_name, assigned_to").in("id", leadIds);
  const leadById = Object.fromEntries((leads ?? []).map((l) => [l.id, l]));

  return actions.map((a) => ({
    actionId: a.id,
    leadId: a.lead_id,
    leadName: leadById[a.lead_id]?.full_name ?? null,
    performedBy: a.performed_by,
    // The task's own assignee wins when set (someone specific was handed
    // this follow-up) — otherwise fall back to the lead's overall owner.
    assignedTo: a.assigned_to ?? leadById[a.lead_id]?.assigned_to ?? null,
    followUpAt: a.follow_up_at as string,
  }));
}

export async function markActionsNotified(actionIds: string[]): Promise<void> {
  if (actionIds.length === 0) return;
  await adminClient.from("lead_actions").update({ notified_at: new Date().toISOString() }).in("id", actionIds);
}
