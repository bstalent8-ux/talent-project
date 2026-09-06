// ─── Leads CRM service (SERVER ONLY) ─────────────────────────────────────────
// Every write goes through the service role — callers (API routes) are
// responsible for their own requireAdmin() check, same as every other admin
// service in features/admin/services/admin.service.ts. Never import this
// from a "use client" file.

import { adminClient } from "@/lib/supabase/admin";
import { normalizeEmail, normalizeHandle, normalizePhone, normalizeText } from "@/lib/leads/normalize";
import {
  DEFAULT_FOLLOW_UP_DAYS,
  type Lead,
  type LeadAction,
  type LeadIdentityInput,
  type LeadSource,
  type LeadStatus,
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
  status: LeadStatus;
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
  created_at: string;
}

async function namesFor(userIds: (string | null)[]): Promise<Record<string, string | null>> {
  const ids = Array.from(new Set(userIds.filter((id): id is string => !!id)));
  if (ids.length === 0) return {};
  const { data } = await adminClient.from("profiles").select("id, full_name").in("id", ids);
  return Object.fromEntries((data ?? []).map((p) => [p.id, p.full_name]));
}

function toLead(row: LeadRow, names: Record<string, string | null>): Lead {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    socialHandle: row.social_handle,
    extra: row.extra ?? {},
    status: row.status,
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

function toLeadAction(row: LeadActionRow, names: Record<string, string | null>): LeadAction {
  return {
    id: row.id,
    leadId: row.lead_id,
    actionType: row.action_type,
    note: row.note,
    performedBy: row.performed_by,
    performedByName: row.performed_by ? names[row.performed_by] ?? null : null,
    followUpAt: row.follow_up_at,
    notifiedAt: row.notified_at,
    createdAt: row.created_at,
  };
}

// ─── Read ─────────────────────────────────────────────────────────────────

export interface LeadsPageParams {
  page?: number;
  pageSize?: number;
  status?: string;
}

export async function fetchLeadsPage({ page = 1, pageSize = 10, status }: LeadsPageParams): Promise<LeadsPageResult> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = adminClient
    .from("leads")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status && status !== "all") query = query.eq("status", status);

  const { data, count, error } = await query;
  if (error || !data) return { leads: [], total: 0 };

  const rows = data as LeadRow[];
  const names = await namesFor(rows.flatMap((r) => [r.assigned_to, r.created_by]));
  return { leads: rows.map((r) => toLead(r, names)), total: count ?? 0 };
}

export async function fetchLeadById(id: string): Promise<LeadWithActions | null> {
  const { data: leadRow, error } = await adminClient.from("leads").select("*").eq("id", id).single();
  if (error || !leadRow) return null;

  const { data: actionRows } = await adminClient
    .from("lead_actions")
    .select("*")
    .eq("lead_id", id)
    .order("created_at", { ascending: false });

  const row = leadRow as LeadRow;
  const actions = (actionRows ?? []) as LeadActionRow[];
  const names = await namesFor([row.assigned_to, row.created_by, ...actions.map((a) => a.performed_by)]);

  return {
    ...toLead(row, names),
    actions: actions.map((a) => toLeadAction(a, names)),
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
  source: LeadSource
): Promise<CreateLeadResult> {
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);
  const socialHandle = normalizeHandle(input.socialHandle);
  const fullName = normalizeText(input.fullName);
  const extra = input.extra ?? {};

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
        })
        .eq("id", row.id)
        .select("*")
        .single();
      const merged = (updated ?? row) as LeadRow;
      const names = await namesFor([merged.assigned_to, merged.created_by]);
      return { lead: toLead(merged, names), merged: true, flaggedDuplicate: false };
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

  const { data: created, error } = await adminClient
    .from("leads")
    .insert({
      full_name: fullName,
      phone,
      email,
      social_handle: socialHandle,
      extra,
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
  return { lead: toLead(row, names), merged: false, flaggedDuplicate: !!possibleDuplicateOf };
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

export async function updateLeadStatus(leadId: string, status: LeadStatus): Promise<boolean> {
  const { error } = await adminClient.from("leads").update({ status }).eq("id", leadId);
  return !error;
}

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
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[leads] addLeadAction failed:", error?.message);
    return null;
  }

  const row = data as LeadActionRow;
  const names = await namesFor([row.performed_by]);
  return toLeadAction(row, names);
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
    .select("id, lead_id, performed_by, follow_up_at")
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
    assignedTo: leadById[a.lead_id]?.assigned_to ?? null,
    followUpAt: a.follow_up_at as string,
  }));
}

export async function markActionsNotified(actionIds: string[]): Promise<void> {
  if (actionIds.length === 0) return;
  await adminClient.from("lead_actions").update({ notified_at: new Date().toISOString() }).in("id", actionIds);
}
