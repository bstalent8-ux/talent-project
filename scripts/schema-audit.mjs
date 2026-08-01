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

const columnChecks = {
  profiles: [
    "account_status",
    "blocked_at",
    "blocked_by",
    "block_reason",
  ],
  bookings: [
    "budget_type",
    "budget_amount",
    "talent_user_id",
    "service_type",
    "job_id",
    "currency",
    "deadline",
    "updated_at",
  ],
  community_questions: ["updated_at"],
  community_answers: ["updated_at"],
  notifications: [
    "recipient_id",
    "sender_id",
    "message",
    "action_url",
    "metadata",
    "priority",
    "read_at",
    "expires_at",
    "broadcast_id",
  ],
  packages: ["slug", "sort_order", "audience", "features"],
  subscriptions: [
    "package_id",
    "current_period_start",
    "current_period_end",
  ],
};

const tableChecks = [
  "deliverables",
  "contact_messages",
  "user_usage",
  "notification_types",
  "notification_broadcasts",
  "conversation_presence",
];

let failures = 0;

for (const [table, columns] of Object.entries(columnChecks)) {
  const { error } = await supabase.from(table).select(columns.join(",")).limit(0);
  if (error) {
    failures += 1;
    console.error(`FAIL ${table}: ${error.message}`);
  } else {
    console.log(`OK   ${table}: ${columns.join(", ")}`);
  }
}

for (const table of tableChecks) {
  const { error } = await supabase.from(table).select("*").limit(0);
  if (error) {
    failures += 1;
    console.error(`FAIL ${table}: ${error.message}`);
  } else {
    console.log(`OK   ${table}`);
  }
}

if (failures) {
  console.error(`Schema audit failed with ${failures} missing table/column checks.`);
  process.exit(1);
}

console.log("Schema audit passed.");
