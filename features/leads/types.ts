// ─── Leads CRM domain types ───────────────────────────────────────────────
// Shared by the service layer (features/leads/services/leads.service.ts),
// the admin API routes (app/api/admin/leads/**) and the admin UI. Kept
// import-free of "@/lib/supabase/admin" so client components can import
// these types without pulling the service-role key in.

export const LEAD_STATUSES = ["new", "contacted", "interested", "not_interested", "converted"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_SOURCES = ["manual", "excel", "sheet"] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export interface Lead {
  id:                   string;
  fullName:             string | null;
  phone:                string | null;
  email:                string | null;
  socialHandle:         string | null;
  extra:                Record<string, string>;
  status:               LeadStatus;
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

export const LEAD_ACTION_TYPES = ["call", "message", "email", "meeting", "note"] as const;
export type LeadActionType = (typeof LEAD_ACTION_TYPES)[number];

/** Default follow-up window applied when logging an action with no explicit date. */
export const DEFAULT_FOLLOW_UP_DAYS = 2;
