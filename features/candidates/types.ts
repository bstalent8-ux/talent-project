// ─── Recruitment CRM domain types ────────────────────────────────────────────
// Parallel structure to features/leads/types.ts — same dynamic-stage engine,
// applied to job applicants. Kept import-free of "@/lib/supabase/admin" so
// client components can import these types without pulling the service-role
// key in. See supabase/migrations/20260907_candidates_recruitment.sql.

export const CANDIDATE_SOURCES = ["manual", "excel", "sheet"] as const;
export type CandidateSource = (typeof CANDIDATE_SOURCES)[number];

export type StageFieldType = "text" | "date" | "select" | "textarea" | "number";
export const STAGE_FIELD_TYPES: StageFieldType[] = ["text", "date", "select", "textarea", "number"];

export interface StageFieldOption {
  value: string;
  labelAr: string;
  labelEn: string;
}

export interface CandidateStageField {
  id:        string;
  stageId:   string;
  fieldKey:  string;
  labelAr:   string;
  labelEn:   string;
  fieldType: StageFieldType;
  options:   StageFieldOption[] | null;
  required:  boolean;
  sortOrder: number;
}

/** A recruitment-pipeline stage — admin-managed, seeded with New/Contacted/
 *  Interview/Rejected/Accepted but freely add/remove/reorder-able. */
export interface CandidateStage {
  id:        string;
  key:       string;
  labelAr:   string;
  labelEn:   string;
  color:     string;
  sortOrder: number;
  fields:    CandidateStageField[];
  /** Count of candidates currently on this stage. */
  candidateCount: number;
}

export interface CandidateStageSummary {
  id:      string;
  key:     string;
  labelAr: string;
  labelEn: string;
  color:   string;
}

/** Job-type/category taxonomy term (Model, UGC, Influencer...). */
export interface CandidateCategoryTerm {
  id:        string;
  key:       string;
  labelAr:   string;
  labelEn:   string;
  sortOrder: number;
  candidateCount: number;
}

export interface CandidateCategorySummary {
  id:      string;
  key:     string;
  labelAr: string;
  labelEn: string;
}

export interface Candidate {
  id:                   string;
  fullName:             string | null;
  phone:                string | null;
  email:                string | null;
  socialHandle:         string | null;
  extra:                Record<string, string>;
  stage:                CandidateStageSummary | null;
  category:             CandidateCategorySummary | null;
  /** Free-text job/role applied for. */
  jobTitle:             string | null;
  expectedSalary:       number | null;
  /** How this row entered the CRM — manual/excel/sheet, distinct from any
   *  "how did the candidate find us" concept (not tracked here). */
  source:               CandidateSource;
  assignedTo:           string | null;
  assignedToName:       string | null;
  createdBy:            string | null;
  createdByName:        string | null;
  possibleDuplicateOf:  string | null;
  createdAt:            string;
  updatedAt:            string;
}

export interface CandidateAction {
  id:              string;
  candidateId:     string;
  actionType:      string;
  note:            string | null;
  performedBy:     string | null;
  performedByName: string | null;
  followUpAt:      string | null;
  notifiedAt:      string | null;
  stage:           CandidateStageSummary | null;
  stageAnswers:    Record<string, string> | null;
  assignedTo:      string | null;
  assignedToName:  string | null;
  createdAt:       string;
}

export interface CandidateWithActions extends Candidate {
  actions: CandidateAction[];
}

export interface CandidatesPageResult {
  candidates: Candidate[];
  total: number;
}

export interface CandidateIdentityInput {
  fullName?:     string | null;
  phone?:        string | null;
  email?:        string | null;
  socialHandle?: string | null;
  extra?:        Record<string, string>;
}

export const CANDIDATE_ACTION_TYPES = ["call", "message", "email", "meeting", "note"] as const;
export type CandidateActionType = (typeof CANDIDATE_ACTION_TYPES)[number];

export const STAGE_CHANGE_ACTION_TYPE = "stage_change";
export const CANDIDATE_ASSIGN_ACTION_TYPE = "candidate_assigned";

export const DEFAULT_FOLLOW_UP_DAYS = 2;
