// ─── Cross-CRM activity log types ────────────────────────────────────────────
// One combined feed over lead_actions + candidate_actions — "what got done
// today" and "what's due today", optionally by person. Client-safe (no
// server imports).

export type ActivityModule = "lead" | "candidate";

export interface ActivityEntry {
  id:              string;
  module:          ActivityModule;
  recordId:        string;
  recordName:      string | null;
  actionType:      string;
  note:            string | null;
  performedBy:     string | null;
  performedByName: string | null;
  assignedTo:      string | null;
  assignedToName:  string | null;
  followUpAt:      string | null;
  notifiedAt:      string | null;
  createdAt:       string;
  stageLabelAr:    string | null;
  stageLabelEn:    string | null;
  stageColor:      string | null;
}

export interface ActivityResult {
  done: ActivityEntry[];
  due:  ActivityEntry[];
  /** Which modules this caller can actually see — the UI hides a module's
   *  filter/section entirely rather than showing an always-empty one. */
  modules: ActivityModule[];
}
