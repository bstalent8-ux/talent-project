// Full backup of every table touched by the test-data cleanup, dumped to
// local JSON files BEFORE anything gets deleted. Read-only against the DB —
// writes only to local disk. Run: npx tsx scripts/_tmp_backup_before_cleanup.ts
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";
import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const OUT_DIR = process.argv[2] || path.resolve(process.cwd(), "_db_backup_" + new Date().toISOString().replace(/[:.]/g, "-"));

const TABLES = [
  "profiles", "talent_profiles", "reviews", "contact_messages",
  "bookings", "booking_briefs", "deliverables", "payments", "booking_history",
  "portfolio_items", "talent_verifications", "talent_brands",
  "conversations", "messages", "notifications", "notification_broadcasts",
  "jobs", "job_applications",
  "community_questions", "community_answers",
  "user_events", "subscriptions", "user_usage",
];

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // auth.users separately — admin API, not a public table.
  const { data: authList, error: authErr } = await db.auth.admin.listUsers({ perPage: 1000 });
  if (authErr) console.log("auth.users backup FAILED:", authErr.message);
  else {
    const rows = (authList?.users ?? []).map((u) => ({ id: u.id, email: u.email, created_at: u.created_at }));
    fs.writeFileSync(path.join(OUT_DIR, "auth_users.json"), JSON.stringify(rows, null, 2));
    console.log("auth_users".padEnd(24), rows.length, "rows");
  }

  for (const table of TABLES) {
    const { data, error } = await db.from(table).select("*");
    if (error) {
      console.log(table.padEnd(24), "SKIPPED —", error.message);
      continue;
    }
    fs.writeFileSync(path.join(OUT_DIR, `${table}.json`), JSON.stringify(data, null, 2));
    console.log(table.padEnd(24), (data ?? []).length, "rows");
  }

  console.log("\nBackup written to:", OUT_DIR);
}
main();
