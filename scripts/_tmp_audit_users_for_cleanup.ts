// READ-ONLY audit — lists every profile with signup date/role/email and a
// best-guess test/real flag, for a human to review before deleting anything.
// Does not touch the database. Run: npx tsx scripts/_tmp_audit_users_for_cleanup.ts
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Real-world cutoff: everyone confirmed real before this is added to the
// keep-list by name below; the date only tie-breaks the ambiguous middle.
const CUTOFF = new Date("2026-08-26T00:00:00.000Z"); // Wednesday
const TEST_EMAIL_SUFFIX = "@talents-test.com";
const KNOWN_TEST_HANDLES = new Set(["decore-stores-eg", "admin-1"]);
const KNOWN_REAL_HANDLES = new Set(["joyadel2005", "andrew-sherif"]); // named real people from earlier this project

async function main() {
  const { data: profiles, error } = await db
    .from("profiles")
    .select("id, handle, full_name, role, created_at, account_status")
    .order("created_at", { ascending: true });
  if (error) { console.error(error); return; }

  const { data: authList } = await db.auth.admin.listUsers({ perPage: 1000 });
  const emailById = new Map((authList?.users ?? []).map((u) => [u.id, u.email ?? ""]));

  let testCount = 0, realCount = 0, reviewCount = 0;
  console.log("verdict".padEnd(8), "created_at".padEnd(20), "role".padEnd(8), "handle".padEnd(24), "email");
  for (const p of profiles ?? []) {
    const email = emailById.get(p.id) ?? "";
    const createdAt = new Date(p.created_at);
    let verdict: "TEST" | "REAL" | "REVIEW";
    if (KNOWN_REAL_HANDLES.has(p.handle)) verdict = "REAL";
    else if (KNOWN_TEST_HANDLES.has(p.handle) || email.endsWith(TEST_EMAIL_SUFFIX)) verdict = "TEST";
    else verdict = createdAt >= CUTOFF ? "REAL" : "REVIEW";

    if (verdict === "TEST") testCount++;
    else if (verdict === "REAL") realCount++;
    else reviewCount++;

    console.log(
      verdict.padEnd(8),
      p.created_at.slice(0, 19).padEnd(20),
      (p.role ?? "").padEnd(8),
      (p.handle ?? "").padEnd(24),
      email,
    );
  }
  console.log(`\nTotals — TEST: ${testCount}  REAL: ${realCount}  REVIEW (pre-cutoff, no clear signal): ${reviewCount}`);
}
main();
