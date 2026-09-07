// ─── Leads CRM domain types ───────────────────────────────────────────────
// Shared by the service layer (features/leads/services/leads.service.ts),
// the admin API routes (app/api/admin/leads/**) and the admin UI. Kept
// import-free of "@/lib/supabase/admin" so client components can import
// these types without pulling the service-role key in.

export const LEAD_SOURCES = ["manual", "excel", "sheet"] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export type StageFieldType = "text" | "date" | "select" | "textarea" | "number";
export const STAGE_FIELD_TYPES: StageFieldType[] = ["text", "date", "select", "textarea", "number"];

export interface StageFieldOption {
  value: string;
  labelAr: string;
  labelEn: string;
}

/** One custom question a stage asks when a lead is moved onto it. */
export interface LeadStageField {
  id:        string;
  stageId:   string;
  fieldKey:  string;
  labelAr:   string;
  labelEn:   string;
  fieldType: StageFieldType;
  options:   StageFieldOption[] | null; // only meaningful for fieldType === "select"
  required:  boolean;
  sortOrder: number;
}

/** A pipeline stage — admin-managed, not a fixed enum. Replaces the old
 *  `Lead.status` union entirely; see supabase/migrations/20260907_leads_dynamic_stages.sql. */
export interface LeadStage {
  id:        string;
  key:       string;
  labelAr:   string;
  labelEn:   string;
  color:     string; // hex — board column header / status pill background
  sortOrder: number;
  fields:    LeadStageField[];
  /** Count of leads currently on this stage — lets the admin see the blast
   *  radius before deleting it (leads on a deleted stage move to the next
   *  remaining one, see resolveDuplicate-style fallback in the service). */
  leadCount: number;
}

/** Embedded on `Lead` so every list/board/detail view has the label + color
 *  it needs without a second lookup — populated server-side, same
 *  join-in-JS pattern as `assignedToName`. */
export interface LeadStageSummary {
  id:      string;
  key:     string;
  labelAr: string;
  labelEn: string;
  color:   string;
}

/** A single admin-managed term in either `lead_channels` (where the lead
 *  actually came from — Facebook Ads, a WhatsApp group...) or
 *  `lead_categories` (what kind of talent — Model, UGC...). Both tables
 *  share this exact shape; see lead-taxonomy.service.ts. */
export interface LeadTaxonomyTerm {
  id:        string;
  key:       string;
  labelAr:   string;
  labelEn:   string;
  sortOrder: number;
  /** Count of leads currently tagged with this term. */
  leadCount: number;
}

/** Embedded on `Lead` — same reasoning as LeadStageSummary. */
export interface LeadTaxonomySummary {
  id:      string;
  key:     string;
  labelAr: string;
  labelEn: string;
}

export interface Lead {
  id:                   string;
  fullName:             string | null;
  phone:                string | null;
  email:                string | null;
  socialHandle:         string | null;
  extra:                Record<string, string>;
  stage:                LeadStageSummary | null;
  /** Where the lead actually came from (Facebook Ads, a group...) —
   *  distinct from `source` below, which is how the row entered this CRM. */
  channel:              LeadTaxonomySummary | null;
  /** What kind of talent this lead is (Model, UGC...). */
  category:             LeadTaxonomySummary | null;
  source:                LeadSource;
  assignedTo:           string | null;
  assignedToName:       string | null;
  createdBy:            string | null;
  createdByName:        string | null;
  possibleDuplicateOf:  string | null;
  createdAt:            string;
  updatedAt:            string;
}

export interface LeadAction {
  id:              string;
  leadId:          string;
  actionType:      string;
  note:            string | null;
  performedBy:     string | null;
  performedByName: string | null;
  followUpAt:      string | null;
  notifiedAt:      string | null;
  /** Set only when actionType === "stage_change". */
  stage:           LeadStageSummary | null;
  stageAnswers:    Record<string, string> | null;
  /** Who this specific task/follow-up is for — separate from the lead's own
   *  `assignedTo` (see lead_actions.assigned_to migration). Null means "no
   *  one in particular", not "unassigned lead". */
  assignedTo:      string | null;
  assignedToName:  string | null;
  createdAt:       string;
}

export interface LeadWithActions extends Lead {
  actions: LeadAction[];
}

export interface LeadsPageResult {
  leads: Lead[];
  total: number;
}

/** Raw identity fields a new lead can arrive with — everything optional. */
export interface LeadIdentityInput {
  fullName?:     string | null;
  phone?:        string | null;
  email?:        string | null;
  socialHandle?: string | null;
  extra?:        Record<string, string>;
}

/** Manually chosen from "Log a new action" — distinct from "stage_change",
 *  which only ever happens through the move-stage flow (board drag or the
 *  detail page's stage picker), never a free choice in this list. */
export const LEAD_ACTION_TYPES = ["call", "message", "email", "meeting", "note"] as const;
export type LeadActionType = (typeof LEAD_ACTION_TYPES)[number];

export const STAGE_CHANGE_ACTION_TYPE = "stage_change";

/** Logged automatically whenever a lead's owner (`leads.assigned_to`)
 *  changes — single or bulk — so it shows in the timeline like any other
 *  history entry, never a silent column update. */
export const LEAD_ASSIGN_ACTION_TYPE = "lead_assigned";

/** Default follow-up window applied when logging an action with no explicit date. */
export const DEFAULT_FOLLOW_UP_DAYS = 2;
