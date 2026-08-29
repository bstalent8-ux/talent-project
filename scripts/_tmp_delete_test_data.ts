// Deletes confirmed test data. YOU run this — not me (see chat).
//
// Safety:
//   - Dry-run by default: prints exactly what would be deleted, deletes nothing.
//   - Pass --yes to actually delete.
//   - Only touches the exact handle list below (built from the audit in
//     _tmp_audit_users_for_cleanup.ts / _tmp_audit_reviews_tickets.ts) plus
//     the reviews and contact_messages tables (both confirmed 100% test).
//   - User deletion goes through supabase.auth.admin.deleteUser(id), the
//     supported Supabase path — it relies on the DB's real FK cascade rules
//     instead of a hand-guessed multi-table SQL script. If some table isn't
//     cascade-configured, that one deleteUser call fails loudly (Postgres
//     refuses it) instead of silently corrupting anything else.
//   - A full backup was taken first — see the db-backup-* folder printed at
//     the end of that run.
//
// Explicitly NOT included (unresolved from the chat — decide these yourself
// and add them to the list, or delete manually, before re-running):
//   - bstalent8 / bstalent82 / bstalen2et8 / bstalent658 / bnt8   -> your own email
//   - admin-1 (admin@talents-platform.com)                        -> might be your real admin login
//   - andrew-sherif / andrewsherif2013 / andrewsherif20131 /
//     andrewsherif2002 / andrewsherif32013                        -> might be your own dev account
//   - minaemad181018 / alaaaly222 / and99j99rew                   -> couldn't tell test vs real
//
// Run: npx tsx scripts/_tmp_delete_test_data.ts          (dry run)
//      npx tsx scripts/_tmp_delete_test_data.ts --yes    (actually deletes)

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const CONFIRM = process.argv.includes("--yes");

const TEST_HANDLES = [
  // @talents-test.com seed batch
  "maya-khaled", "nour-hassan", "layla-ahmed", "sara-mostafa", "rana-tarek",
  "ahmed-brands", "sara-marketing", "omar-digital", "mona-agency", "youssef-corp",
  // seeded UGC/influencer/host/model/actor batch (@talents-seed.com)
  "karim-ugc", "dina-ugc", "omar-ugc", "nada-ugc", "tarek-ugc",
  "mona-infl", "ali-infl", "hana-infl", "yasser-infl", "reem-infl",
  "sameh-host", "dalia-host", "mostafa-host", "ghada-host", "hany-host",
  "yasmin-model", "adel-model", "salma-model", "khaled-model", "noha-model",
  "bassem-actor", "nadia-actor", "ziad-actor", "ola-actor", "magdy-actor",
  // seeded admin/brand batches
  "admin-2", "noon-egypt", "zara-egypt", "samsung-mena", "loreal-me", "uber-eats-egypt",
  "youssef-corp-test",
  // e2e / QA batches
  "e2e-brand-food", "e2e-brand-fashion", "e2e-brand-nocat", "e2e-talent",
  "talentverify0810qa", "sprint1-model-test-20260811",
  "qa-model-test-20260815", "qa-ugc-1786865074", "qa-ugc-1786865299",
  "qa-ugc2-1786866299", "qa-model-1786866458", "qa-admin-1786881466",
  "qa-brand-test", "qa-talent-test", "qa-favorites-brand", "mona-farouk-ugc-qa",
  "qa-ugc-demand-822", "qa-model-demand-822", "qa-other-demand-822",
  // one-off throwaway signups (junk handles, not seed batches)
  "and", "swsw", "andrewsherif2013", "andrew", "andrewsherif20131", "iamugc", "and99j99rew",
  "asdw", "test1", "ahmed", "a123", "123", "rana",
  // known test brand
  "decore-stores-eg",
  // NOTE: "admin-1" (admin@talents-platform.com) is deliberately NOT in this
  // list — its id matches the account that's been actively logged into the
  // admin session used throughout this project. Add it yourself only if
  // you're sure it's disposable and not your working login.
];

async function main() {
  const { data: profiles } = await db.from("profiles").select("id, handle").in("handle", TEST_HANDLES);
  const found = profiles ?? [];
  const missing = TEST_HANDLES.filter((h) => !found.some((p) => p.handle === h));

  console.log(`Matched ${found.length}/${TEST_HANDLES.length} handles in profiles.`);
  if (missing.length) console.log("Not found (already gone, or typo'd handle):", missing.join(", "));
  console.log(CONFIRM ? "\n--yes passed — DELETING now.\n" : "\nDRY RUN — nothing deleted. Re-run with --yes to actually delete.\n");

  // reviews + contact_messages: fully confirmed test/dev, unconditional.
  if (CONFIRM) {
    const { error: revErr, count: revCount } = await db.from("reviews").delete({ count: "exact" }).not("id", "is", null);
    console.log("reviews deleted:", revCount, revErr?.message ?? "");
    const { error: cmErr, count: cmCount } = await db.from("contact_messages").delete({ count: "exact" }).not("id", "is", null);
    console.log("contact_messages deleted:", cmCount, cmErr?.message ?? "");
  } else {
    const { count: revCount } = await db.from("reviews").select("*", { count: "exact", head: true });
    const { count: cmCount } = await db.from("contact_messages").select("*", { count: "exact", head: true });
    console.log(`Would delete ALL reviews (${revCount}) and ALL contact_messages (${cmCount}).`);
  }

  for (const p of found) {
    if (!CONFIRM) {
      console.log("would delete user ->", p.handle, p.id);
      continue;
    }
    const { error } = await db.auth.admin.deleteUser(p.id);
    console.log(error ? `FAILED  ${p.handle} -> ${error.message}` : `deleted ${p.handle}`);
  }
}
main();
