import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local", quiet: true });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// ─── Columns application code reads that have no migration file ──────────────
// (the DB is the source of truth — see CLAUDE.md §6). Each entry here has bitten
// production at least once when it silently drifted.
const columnChecks = {
  profiles: ["account_status", "blocked_at", "block_reason", "balance", "brand_status", "is_verified"],
  bookings: ["talent_user_id", "service_type", "job_id", "paid_at", "completed_at", "brief_url", "package_id"],
  community_questions: ["updated_at"],
  community_answers: ["updated_at"],
  notifications: ["recipient_id", "sender_id", "message", "action_url", "metadata", "priority", "read_at", "expires_at", "broadcast_id"],
  subscriptions: ["plan_id", "status", "user_id"],
  // The escrow shape — the 2026-09-09 "paid" bug + the 2026-09-10 frozen-trigger
  // bug both lived here. platform_fee / talent_payout are DB-computed.
  payments: ["booking_id", "client_id", "talent_id", "amount", "platform_fee", "talent_payout", "currency", "status", "payment_method", "held_at", "released_at", "refunded_at", "admin_note", "proof_url"],
  reviews: ["status", "proof_link", "review_type"],
  talent_profiles: ["packages", "social_links", "profile_views", "avg_rating", "total_reviews", "status", "approved_at", "rejection_reason"],
  // leads CRM — the admin table + sortable columns read channel_id/category_id
  // (migration 20260907_leads_channel_category.sql).
  leads: ["stage_id", "channel_id", "category_id", "assigned_to"],
  candidates: ["stage_id", "category_id", "assigned_to", "expected_salary", "job_title"],
  deliverables: ["booking_id", "submitted_by", "files", "links", "notes", "status"],
};

const tableChecks = [
  "contact_messages", "notification_types",
  "notification_broadcasts", "conversation_presence", "booking_briefs",
  "booking_history", "portfolio_items", "talent_brands", "talent_verifications",
  "jobs", "job_applications",
  // newer features, all migration-file-backed but not auto-applied
  "blog_posts", "health_check_runs", "user_events", "rate_limits",
  "lead_actions", "lead_stages", "lead_channels", "lead_categories",
  "candidate_actions", "candidate_stages", "candidate_categories",
];

// ─── RPCs the app calls that were added by hand-run migrations ──────────────
// Probed with a harmless zero-effect call. A "function not found" = drift.
const rpcChecks = [
  { name: "increment_balance", args: { user_id: "00000000-0000-0000-0000-000000000000", amount: 0 } },
  { name: "rl_hit", args: { p_bucket: "schema-audit", p_window_seconds: 60, p_max_hits: 999 } },
];

let failures = 0;
const fail = (msg) => { failures += 1; console.error(`FAIL ${msg}`); };

for (const [table, columns] of Object.entries(columnChecks)) {
  const { error } = await supabase.from(table).select(columns.join(",")).limit(0);
  if (error) fail(`${table}: ${error.message}`);
  else console.log(`OK   ${table}: ${columns.length} columns`);
}

for (const table of tableChecks) {
  const { error } = await supabase.from(table).select("*").limit(0);
  if (error) fail(`${table}: ${error.message}`);
  else console.log(`OK   ${table}`);
}

for (const { name, args } of rpcChecks) {
  const { error } = await supabase.rpc(name, args);
  if (error && /not find the function|does not exist|schema cache/i.test(error.message)) {
    fail(`rpc ${name}: ${error.message}`);
  } else {
    console.log(`OK   rpc ${name}`);
  }
}
await supabase.from("rate_limits").delete().eq("bucket", "schema-audit").then(() => {}, () => {});

// ─── Regression guard: the notifications trigger froze payments.status ──────
// (2026-09-10). Verify a real status change still goes through.
{
  const { data: rows } = await supabase.from("payments").select("id, status").limit(1);
  if (rows?.length) {
    const row = rows[0];
    const { error } = await supabase.from("payments").update({ status: "held", held_at: new Date().toISOString() }).eq("id", row.id);
    await supabase.from("payments").update({ status: row.status, held_at: null }).eq("id", row.id);
    if (error) fail(`payments.status is not writable — a trigger is throwing: ${error.message}`);
    else console.log("OK   payments.status is writable (no blocking trigger)");
  } else {
    console.log("SKIP payments.status write test — no rows");
  }
}

if (failures) {
  console.error(`\nSchema audit FAILED — ${failures} drift issue(s). The live DB no longer matches what the code expects.`);
  process.exit(1);
}
console.log("\nSchema audit passed.");
