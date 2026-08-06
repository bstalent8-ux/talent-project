import "server-only";

// ─── Admin audit trail ────────────────────────────────────────────────────────
// Abstraction first, storage second.
//
// Every profile-config mutation calls recordAudit() from day one, so Phase 4
// only has to run the migration — no retrofitting calls into 9 route files.
//
// Until admin_audit_log exists (supabase/migrations/20260807_admin_audit_log.sql,
// supplied separately and NOT yet applied), writes fail and are swallowed with a
// console warning. An audit write must NEVER break the mutation it records:
// the same rule the notification layer already follows (CLAUDE.md §10.4).

import { adminClient } from "@/lib/supabase/admin";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "enable"
  | "disable"
  | "reorder";

export type AuditEntityType =
  | "profile_type"
  | "profile_section"
  | "profile_field"
  | "profile_layout";

export interface AuditEntry {
  /** profiles.id of the acting admin. */
  adminId:    string;
  action:     AuditAction;
  entityType: AuditEntityType;
  entityId:   string;
  /** Row state before the mutation. null for a create. */
  before?:    unknown;
  /** Row state after the mutation. null for a delete. */
  after?:     unknown;
  /** Free-form context, e.g. { reason: "guard rejected" }. Never secrets. */
  metadata?:  Record<string, unknown>;
}

/**
 * Strips values that should never land in an audit row.
 *
 * The config tables hold no secrets today, but this is the choke point where a
 * future column containing one would otherwise leak into a long-lived log.
 */
const REDACTED_KEYS = new Set(["password", "token", "secret", "service_role_key", "api_key"]);

function redact(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.map(redact);
  if (typeof value !== "object") return value;

  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    out[key] = REDACTED_KEYS.has(key.toLowerCase()) ? "[redacted]" : redact(v);
  }
  return out;
}

/** True once a write has failed because the table is absent — stops log spam. */
let storageUnavailable = false;

export const auditService = {
  /**
   * Records one mutation. Never throws, never rejects.
   * Returns true when the row was persisted.
   */
  async record(entry: AuditEntry): Promise<boolean> {
    try {
      const { error } = await adminClient.from("admin_audit_log").insert({
        admin_id:    entry.adminId,
        action:      entry.action,
        entity_type: entry.entityType,
        entity_id:   entry.entityId,
        before_value: redact(entry.before ?? null),
        after_value:  redact(entry.after ?? null),
        metadata:     entry.metadata ?? {},
        // created_at is defaulted by the table.
      });

      if (error) {
        // 42P01 = undefined_table. Expected until the migration is applied.
        if (error.code === "42P01") {
          if (!storageUnavailable) {
            storageUnavailable = true;
            console.warn(
              "[audit] admin_audit_log does not exist yet — audit entries are being dropped. " +
              "Apply supabase/migrations/20260807_admin_audit_log.sql to enable persistence.",
            );
          }
          logToConsole(entry);
          return false;
        }

        console.error("[audit] write failed", error.code, error.message);
        logToConsole(entry);
        return false;
      }

      return true;
    } catch (e) {
      console.error("[audit] write threw", e);
      logToConsole(entry);
      return false;
    }
  },
};

/**
 * Fallback sink. Keeps a trace in Cloudflare logs while the table is missing,
 * so nothing is silently lost during the interim.
 */
function logToConsole(entry: AuditEntry): void {
  console.info("[audit:fallback]", JSON.stringify({
    at:         new Date().toISOString(),
    adminId:    entry.adminId,
    action:     entry.action,
    entityType: entry.entityType,
    entityId:   entry.entityId,
  }));
}

export type AuditService = typeof auditService;
