// Deletes every account created before 2026-08-25, except: admins, the two
// deliberately-kept layout-test accounts (maya-khaled, nour-hassan), and
// andrew-sherif (kept, already hidden from Explore via talent_profiles.status).
//
// YOU run this — not Claude. This tool's own permission classifier blocked
// running auth.admin.deleteUser() directly in this session (destructive,
// irreversible), so it's handed to you as a real script instead, same
// pattern as the older scripts/_tmp_delete_test_data.ts.
//
// Safety:
//   - Dry-run by default: prints exactly who would be deleted, deletes nothing.
//   - Pass --yes to actually delete.
//   - Computes the list live from the DB (created_at < 2026-08-25), not a
//     hand-typed list — nothing to typo, nothing to fall out of date.
//   - Deletion goes through supabase.auth.admin.deleteUser(id) — relies on
//     the DB's real FK cascade rules. If a table isn't cascade-configured,
//     that one deleteUser call fails loudly instead of silently leaving
//     orphaned rows.
//
// Run: npx tsx scripts/_tmp_delete_before_aug25.ts          (dry run)
//      npx tsx scripts/_tmp_delete_before_aug25.ts --yes    (actually deletes)

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const CONFIRM = process.argv.includes("--yes");
const KEEP_HANDLES = new Set(["maya-khaled", "nour-hassan", "andrew-sherif"]);
const CUTOFF = "2026-08-25T00:00:00Z";

async function main() {
  const { data: profiles, error } = await db
    .from("profiles")
    .select("id, handle, full_name, role, created_at")
    .lt("created_at", CUTOFF)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("query failed:", error.message);
    return;
  }

  const toDelete = (profiles ?? []).filter(
    (p) => p.role !== "admin" && !KEEP_HANDLES.has(p.handle ?? "")
  );
  const kept = (profiles ?? []).filter(
    (p) => p.role === "admin" || KEEP_HANDLES.has(p.handle ?? "")
  );

  console.log(`Found ${profiles?.length ?? 0} accounts before ${CUTOFF}.`);
  console.log(`Keeping ${kept.length}:`, kept.map((k) => k.handle).join(", "));
  console.log(`Deleting ${toDelete.length}.`);
  console.log(CONFIRM ? "\n--yes passed — DELETING now.\n" : "\nDRY RUN — nothing deleted. Re-run with --yes to actually delete.\n");

  for (const p of toDelete) {
    if (!CONFIRM) {
      console.log(`would delete -> ${p.role.padEnd(6)} ${(p.handle ?? "").padEnd(30)} ${p.created_at?.slice(0, 10)}  ${p.full_name}`);
      continue;
    }
    const { error: delErr } = await db.auth.admin.deleteUser(p.id);
    console.log(delErr ? `FAILED  ${p.handle} -> ${delErr.message}` : `deleted ${p.handle}`);
  }
}
main();
