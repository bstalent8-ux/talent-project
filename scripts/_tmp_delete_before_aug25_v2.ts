// Round 2: the first pass (scripts/_tmp_delete_before_aug25.ts) deleted the
// 19 accounts with zero related data. Everyone else failed for one of two
// reasons — this script fixes both:
//
//   1. "User not found" (and, swsw, andrewsherif2013, andrew) — orphaned
//      `profiles` rows with no matching `auth.users` row at all (a signup
//      that broke partway, long ago). deleteUser() has nothing to delete;
//      falls back to deleting the `profiles` row directly.
//
//   2. Empty {} error (everyone else) — Supabase's admin deleteUser doesn't
//      forward the underlying Postgres FK-violation text, but the real
//      cause is real rows in bookings/reviews/portfolio_items/talent_brands/
//      notifications/jobs/etc. still pointing at these accounts (e.g.
//      layla-ahmed alone has 198 bookings + 198 reviews wired to her from
//      the seed data). This script deletes those dependent rows first, in
//      an order that respects their own FKs, then deletes the account.
//
// Still: YOU run this, not Claude (same classifier block as round 1).
//
// Safety:
//   - Dry-run by default (prints planned deletes per table, deletes nothing).
//   - Pass --yes to actually delete.
//   - Every table delete is wrapped individually — a missing/renamed column
//     on one table logs and is skipped, it does not abort the whole run.
//   - Recomputes the target list live (created_at < 2026-08-25, same
//     KEEP_HANDLES as round 1) so it only touches what's actually left.
//
// Run: npx tsx scripts/_tmp_delete_before_aug25_v2.ts          (dry run)
//      npx tsx scripts/_tmp_delete_before_aug25_v2.ts --yes    (actually deletes)

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const CONFIRM = process.argv.includes("--yes");
const KEEP_HANDLES = new Set(["maya-khaled", "nour-hassan", "andrew-sherif"]);
const CUTOFF = "2026-08-25T00:00:00Z";

async function safeDelete(table: string, column: string, values: string[]): Promise<number> {
  if (values.length === 0) return 0;
  try {
    const { data, error } = await db.from(table).delete().in(column, values).select("id");
    if (error) {
      console.log(`    skip ${table}.${column}: ${error.message}`);
      return 0;
    }
    return data?.length ?? 0;
  } catch (e: any) {
    console.log(`    skip ${table}.${column}: ${e.message}`);
    return 0;
  }
}

async function cleanupOne(uid: string, tpid: string | null) {
  // Children of bookings first.
  const { data: bookingsAsBrand } = await db.from("bookings").select("id").eq("brand_id", uid);
  const { data: bookingsAsTalentUser } = await db.from("bookings").select("id").eq("talent_user_id", uid);
  const { data: bookingsAsTalentProfile } = tpid
    ? await db.from("bookings").select("id").eq("talent_id", tpid)
    : { data: [] as { id: string }[] };
  const bookingIds = Array.from(new Set([
    ...(bookingsAsBrand ?? []).map((b) => b.id),
    ...(bookingsAsTalentUser ?? []).map((b) => b.id),
    ...(bookingsAsTalentProfile ?? []).map((b) => b.id),
  ]));

  if (CONFIRM) {
    await safeDelete("deliverables", "booking_id", bookingIds);
    await safeDelete("payments", "booking_id", bookingIds);
    await safeDelete("booking_briefs", "booking_id", bookingIds);
    await safeDelete("booking_history", "booking_id", bookingIds);
    await safeDelete("reviews", "booking_id", bookingIds);
    await safeDelete("conversations", "booking_id", bookingIds);
  }

  if (CONFIRM) {
    await safeDelete("bookings", "id", bookingIds);
    await safeDelete("reviews", "brand_id", [uid]);
    if (tpid) await safeDelete("reviews", "talent_id", [tpid]);

    const { data: jobs } = await db.from("jobs").select("id").eq("brand_id", uid);
    const jobIds = (jobs ?? []).map((j) => j.id);
    await safeDelete("job_applications", "job_id", jobIds);
    if (tpid) await safeDelete("job_applications", "talent_id", [tpid]);
    await safeDelete("jobs", "id", jobIds);

    const { data: convs1 } = await db.from("conversations").select("id").eq("brand_id", uid);
    const { data: convs2 } = tpid ? await db.from("conversations").select("id").eq("talent_id", tpid) : { data: [] as { id: string }[] };
    const convIds = Array.from(new Set([...(convs1 ?? []), ...(convs2 ?? [])].map((c) => c.id)));
    await safeDelete("messages", "conversation_id", convIds);
    await safeDelete("messages", "sender_id", [uid]);
    await safeDelete("conversations", "id", convIds);

    await safeDelete("notifications", "recipient_id", [uid]);
    await safeDelete("notifications", "sender_id", [uid]);
    await safeDelete("user_events", "user_id", [uid]);
    await safeDelete("community_answers", "author_id", [uid]);
    await safeDelete("community_questions", "author_id", [uid]);
    await safeDelete("favorites", "user_id", [uid]);
    await safeDelete("favorites", "talent_user_id", [uid]);
    await safeDelete("talent_type_requests", "user_id", [uid]);
    await safeDelete("talent_verifications", "talent_id", [uid]);
    await safeDelete("profile_categories", "profile_id", [uid]);
    await safeDelete("subscriptions", "user_id", [uid]);
    await safeDelete("user_usage", "user_id", [uid]);

    if (tpid) {
      await safeDelete("portfolio_items", "talent_id", [tpid]);
      await safeDelete("talent_brands", "talent_profile_id", [tpid]);
    }
  } else {
    console.log(`    would clean up ${bookingIds.length} booking(s) and their children, reviews, jobs, conversations, notifications, portfolio, talent_brands`);
  }
}

async function main() {
  const { data: profiles, error } = await db
    .from("profiles")
    .select("id, handle, full_name, role, created_at")
    .lt("created_at", CUTOFF)
    .order("created_at", { ascending: true });

  if (error) { console.error("query failed:", error.message); return; }

  const targets = (profiles ?? []).filter(
    (p) => p.role !== "admin" && !KEEP_HANDLES.has(p.handle ?? "")
  );

  console.log(`${targets.length} accounts left to delete.`);
  console.log(CONFIRM ? "\n--yes passed — CLEANING UP + DELETING now.\n" : "\nDRY RUN — nothing deleted.\n");

  for (const p of targets) {
    console.log(`\n${p.handle} (${p.role}, ${p.created_at?.slice(0, 10)}):`);
    const { data: tp } = await db.from("talent_profiles").select("id").eq("user_id", p.id).maybeSingle();

    await cleanupOne(p.id, tp?.id ?? null);

    if (!CONFIRM) continue;

    if (tp?.id) await safeDelete("talent_profiles", "id", [tp.id]);

    const { error: delErr } = await db.auth.admin.deleteUser(p.id);
    if (!delErr) {
      console.log(`  deleted (auth+profile)`);
      continue;
    }

    if (String(delErr.message ?? "").toLowerCase().includes("not found")) {
      const { error: profErr } = await db.from("profiles").delete().eq("id", p.id);
      console.log(profErr ? `  FAILED (orphan profile delete): ${profErr.message}` : `  deleted (orphan profile, no auth user)`);
    } else {
      console.log(`  STILL FAILED: ${JSON.stringify(delErr)}`);
    }
  }
}
main();
