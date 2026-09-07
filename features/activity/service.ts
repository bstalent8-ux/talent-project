// ─── Cross-CRM activity log service (SERVER ONLY) ────────────────────────────
// Combines lead_actions + candidate_actions into one feed, split into "done"
// (created that day — what actually got logged) and "due" (follow_up_at
// that day — what's supposed to happen: calls, interviews, follow-ups).
// Never import from a "use client" file.

import { adminClient } from "@/lib/supabase/admin";
import { fetchStageSummaries as fetchLeadStageSummaries } from "@/features/leads/services/lead-stages.service";
import { fetchStageSummaries as fetchCandidateStageSummaries } from "@/features/candidates/services/candidate-stages.service";
import type { ActivityEntry, ActivityModule, ActivityResult } from "@/features/activity/types";

interface ActionRow {
  id: string;
  lead_id?: string;
  candidate_id?: string;
  action_type: string;
  note: string | null;
  performed_by: string | null;
  assigned_to: string | null;
  follow_up_at: string | null;
  notified_at: string | null;
  stage_id: string | null;
  created_at: string;
}

interface StageSummary { id: string; labelAr: string; labelEn: string; color: string }

function dayRangeUtc(dateStr: string): { start: string; end: string } {
  const start = new Date(`${dateStr}T00:00:00.000Z`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

async function namesFor(ids: (string | null | undefined)[]): Promise<Record<string, string | null>> {
  const uniq = Array.from(new Set(ids.filter((x): x is string => !!x)));
  if (uniq.length === 0) return {};
  const { data } = await adminClient.from("profiles").select("id, full_name").in("id", uniq);
  return Object.fromEntries((data ?? []).map((p) => [p.id, p.full_name]));
}

async function recordNamesFor(module: ActivityModule, ids: string[]): Promise<Record<string, string | null>> {
  if (ids.length === 0) return {};
  const table = module === "lead" ? "leads" : "candidates";
  const { data } = await adminClient.from(table).select("id, full_name").in("id", Array.from(new Set(ids)));
  return Object.fromEntries((data ?? []).map((r) => [r.id, r.full_name]));
}

async function fetchModuleRows(
  module: ActivityModule,
  dateCol: "created_at" | "follow_up_at",
  range: { start: string; end: string },
  personId?: string
): Promise<ActionRow[]> {
  const table = module === "lead" ? "lead_actions" : "candidate_actions";
  let q = adminClient.from(table).select("*").gte(dateCol, range.start).lt(dateCol, range.end).order(dateCol, { ascending: true });
  if (personId) q = q.or(`performed_by.eq.${personId},assigned_to.eq.${personId}`);
  const { data, error } = await q;
  if (error) console.error(`[activity] fetchModuleRows(${module}, ${dateCol}) failed:`, error.message);
  return (data ?? []) as ActionRow[];
}

async function toEntries(
  module: ActivityModule,
  rows: ActionRow[],
  names: Record<string, string | null>,
  recordNames: Record<string, string | null>,
  stages: Record<string, StageSummary>
): Promise<ActivityEntry[]> {
  return rows.map((r) => {
    const recordId = module === "lead" ? r.lead_id! : r.candidate_id!;
    const stage = r.stage_id ? stages[r.stage_id] : undefined;
    return {
      id: r.id,
      module,
      recordId,
      recordName: recordNames[recordId] ?? null,
      actionType: r.action_type,
      note: r.note,
      performedBy: r.performed_by,
      performedByName: r.performed_by ? names[r.performed_by] ?? null : null,
      assignedTo: r.assigned_to,
      assignedToName: r.assigned_to ? names[r.assigned_to] ?? null : null,
      followUpAt: r.follow_up_at,
      notifiedAt: r.notified_at,
      createdAt: r.created_at,
      stageLabelAr: stage?.labelAr ?? null,
      stageLabelEn: stage?.labelEn ?? null,
      stageColor: stage?.color ?? null,
    };
  });
}

export interface ActivityFilters {
  /** YYYY-MM-DD, in the server's/user's intended calendar day (UTC-bucketed —
   *  see dayRangeUtc; good enough for an admin tool, no per-viewer timezone
   *  handling). */
  date: string;
  personId?: string;
  /** Which modules the caller is permitted to read — resolved by the caller
   *  from RBAC (requirePermission("leads"/"candidates", "read")) so a
   *  restricted admin only ever sees the module(s) they're granted. */
  modules: ActivityModule[];
}

export async function fetchActivity(filters: ActivityFilters): Promise<ActivityResult> {
  const range = dayRangeUtc(filters.date);
  const done: ActivityEntry[] = [];
  const due: ActivityEntry[] = [];

  for (const module of filters.modules) {
    const [doneRows, dueRows, stages] = await Promise.all([
      fetchModuleRows(module, "created_at", range, filters.personId),
      fetchModuleRows(module, "follow_up_at", range, filters.personId),
      module === "lead" ? fetchLeadStageSummaries() : fetchCandidateStageSummaries(),
    ]);

    const allRows = [...doneRows, ...dueRows];
    const recordIds = allRows.map((r) => (module === "lead" ? r.lead_id : r.candidate_id)).filter((x): x is string => !!x);
    const [names, recordNames] = await Promise.all([
      namesFor(allRows.flatMap((r) => [r.performed_by, r.assigned_to])),
      recordNamesFor(module, recordIds),
    ]);

    done.push(...await toEntries(module, doneRows, names, recordNames, stages));
    due.push(...await toEntries(module, dueRows, names, recordNames, stages));
  }

  done.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  due.sort((a, b) => (a.followUpAt ?? "").localeCompare(b.followUpAt ?? ""));

  return { done, due, modules: filters.modules };
}
