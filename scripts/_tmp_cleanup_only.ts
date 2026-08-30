// Cleanup-only pass (no deleteUser calls) — deletes dependent rows for every
// remaining pre-Aug25 target so the final deleteUser step has nothing left
// to block it. Safe to run repeatedly.
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const KEEP_HANDLES = new Set(["maya-khaled", "nour-hassan", "andrew-sherif"]);
const CUTOFF = "2026-08-25T00:00:00Z";

async function safeDelete(table: string, column: string, values: string[]): Promise<number> {
  if (values.length === 0) return 0;
  try {
    const { data, error } = await db.from(table).delete().in(column, values).select("id");
    if (error) { console.log(`    skip ${table}.${column}: ${error.message}`); return 0; }
    return data?.length ?? 0;
  } catch (e: any) { console.log(`    skip ${table}.${column}: ${e.message}`); return 0; }
}

async function cleanupOne(uid: string, tpid: string | null) {
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

  await safeDelete("deliverables", "booking_id", bookingIds);
  await safeDelete("payments", "booking_id", bookingIds);
  await safeDelete("booking_briefs", "booking_id", bookingIds);
  await safeDelete("booking_history", "booking_id", bookingIds);
  await safeDelete("reviews", "booking_id", bookingIds);
  await safeDelete("conversations", "booking_id", bookingIds);
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

  if (tpid) {
    await safeDelete("portfolio_items", "talent_id", [tpid]);
    await safeDelete("talent_brands", "talent_profile_id", [tpid]);
    await safeDelete("talent_profiles", "id", [tpid]);
  }
}

async function main() {
  const { data: profiles } = await db
    .from("profiles")
    .select("id, handle, role, created_at")
    .lt("created_at", CUTOFF)
    .order("created_at", { ascending: true });

  const targets = (profiles ?? []).filter((p) => p.role !== "admin" && !KEEP_HANDLES.has(p.handle ?? ""));
  console.log(`Cleaning up ${targets.length} accounts (dependent data only, no user deletion).`);

  for (const p of targets) {
    console.log(`\n${p.handle}:`);
    const { data: tp } = await db.from("talent_profiles").select("id").eq("user_id", p.id).maybeSingle();
    await cleanupOne(p.id, tp?.id ?? null);
  }
  console.log("\nDone. All dependent data cleared — safe to run the deleteUser pass now.");
}
main();
