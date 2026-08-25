import { createClient } from "@supabase/supabase-js";

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const KEEP_HANDLES = ["maya-khaled", "nour-hassan", "admin-1"];

async function step(label, fn) {
  try {
    const { count, error } = await fn();
    if (error) { console.log(`[SKIP] ${label}: ${error.message}`); return; }
    console.log(`[OK]   ${label}: ${count ?? "?"} rows`);
  } catch (e) {
    console.log(`[SKIP] ${label}: ${e.message}`);
  }
}

async function countTable(name) {
  const { count } = await admin.from(name).select("*", { count: "exact", head: true });
  return count;
}

console.log("=== BEFORE ===");
for (const t of ["profiles", "talent_profiles", "brand_profiles", "bookings", "booking_briefs", "reviews", "community_questions", "community_answers", "jobs", "job_applications", "portfolio_items", "conversations", "messages"]) {
  console.log(`${t}: ${await countTable(t)}`);
}

const { data: profiles } = await admin.from("profiles").select("id, handle, role");
const targets = profiles.filter(p => !KEEP_HANDLES.includes(p.handle));
const targetIds = targets.map(p => p.id);
console.log(`\nTarget profiles to purge: ${targetIds.length} (kept: ${profiles.length - targetIds.length})`);

const { data: talentRows } = await admin.from("talent_profiles").select("id, user_id").in("user_id", targetIds);
const targetTalentIds = (talentRows ?? []).map(t => t.id);

const { data: bookingRows } = await admin
  .from("bookings")
  .select("id, brand_id, talent_id, talent_user_id");
const targetBookingIds = (bookingRows ?? [])
  .filter(b => targetIds.includes(b.brand_id) || targetIds.includes(b.talent_user_id) || targetTalentIds.includes(b.talent_id))
  .map(b => b.id);

const { data: convRows } = await admin.from("conversations").select("id, brand_id, talent_id");
const targetConvIds = (convRows ?? [])
  .filter(c => targetIds.includes(c.brand_id) || targetIds.includes(c.talent_id))
  .map(c => c.id);

console.log(`Target talent_profiles: ${targetTalentIds.length}, bookings: ${targetBookingIds.length}, conversations: ${targetConvIds.length}`);
console.log("\n=== DELETING ===");

if (targetConvIds.length) {
  await step("messages", () => admin.from("messages").delete({ count: "exact" }).in("conversation_id", targetConvIds));
  await step("conversation_presence", () => admin.from("conversation_presence").delete({ count: "exact" }).in("conversation_id", targetConvIds));
  await step("conversations", () => admin.from("conversations").delete({ count: "exact" }).in("id", targetConvIds));
}

await step("notifications (recipient)", () => admin.from("notifications").delete({ count: "exact" }).in("recipient_id", targetIds));
await step("notifications (sender)", () => admin.from("notifications").delete({ count: "exact" }).in("sender_id", targetIds));

if (targetBookingIds.length) {
  await step("deliverables", () => admin.from("deliverables").delete({ count: "exact" }).in("booking_id", targetBookingIds));
  await step("payments", () => admin.from("payments").delete({ count: "exact" }).in("booking_id", targetBookingIds));
  await step("booking_history", () => admin.from("booking_history").delete({ count: "exact" }).in("booking_id", targetBookingIds));
  await step("booking_briefs", () => admin.from("booking_briefs").delete({ count: "exact" }).in("booking_id", targetBookingIds));
  await step("reviews (by booking)", () => admin.from("reviews").delete({ count: "exact" }).in("booking_id", targetBookingIds));
  await step("bookings", () => admin.from("bookings").delete({ count: "exact" }).in("id", targetBookingIds));
}
if (targetTalentIds.length) {
  await step("reviews (by talent)", () => admin.from("reviews").delete({ count: "exact" }).in("talent_id", targetTalentIds));
  await step("portfolio_items", () => admin.from("portfolio_items").delete({ count: "exact" }).in("talent_id", targetTalentIds));
  await step("talent_brands", () => admin.from("talent_brands").delete({ count: "exact" }).in("talent_id", targetTalentIds));
}
await step("reviews (by brand)", () => admin.from("reviews").delete({ count: "exact" }).in("brand_id", targetIds));
// CLAUDE.md-documented ambiguity: some seeded reviews.talent_id rows point at
// profiles.id instead of talent_profiles.id — catch those too.
await step("reviews (talent_id as profiles.id, legacy ambiguity)", () => admin.from("reviews").delete({ count: "exact" }).in("talent_id", targetIds));
await step("talent_verifications", () => admin.from("talent_verifications").delete({ count: "exact" }).in("user_id", targetIds));

// Community — full wipe, per explicit request.
await step("community_answers (all)", () => admin.from("community_answers").delete({ count: "exact" }).not("id", "is", null));
await step("community_questions (all)", () => admin.from("community_questions").delete({ count: "exact" }).not("id", "is", null));

await step("talent_type_requests", () => admin.from("talent_type_requests").delete({ count: "exact" }).in("user_id", targetIds));

const { data: jobRows } = await admin.from("jobs").select("id, posted_by");
const targetJobIds = (jobRows ?? []).filter(j => targetIds.includes(j.posted_by)).map(j => j.id);
if (targetJobIds.length) {
  await step("job_applications (by job)", () => admin.from("job_applications").delete({ count: "exact" }).in("job_id", targetJobIds));
}
await step("job_applications (by applicant)", () => admin.from("job_applications").delete({ count: "exact" }).in("talent_id", targetIds));
if (targetJobIds.length) {
  await step("jobs", () => admin.from("jobs").delete({ count: "exact" }).in("id", targetJobIds));
}

await step("user_usage", () => admin.from("user_usage").delete({ count: "exact" }).in("user_id", targetIds));
await step("subscriptions", () => admin.from("subscriptions").delete({ count: "exact" }).in("user_id", targetIds));
await step("user_events", () => admin.from("user_events").delete({ count: "exact" }).in("user_id", targetIds));

await step("talent_profiles", () => admin.from("talent_profiles").delete({ count: "exact" }).in("user_id", targetIds));
await step("brand_profiles", () => admin.from("brand_profiles").delete({ count: "exact" }).in("user_id", targetIds));
await step("profiles", () => admin.from("profiles").delete({ count: "exact" }).in("id", targetIds));

console.log("\n=== auth.users ===");
let authDeleted = 0, authFailed = 0;
for (const id of targetIds) {
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) { authFailed++; console.log(`  fail ${id}: ${error.message}`); }
  else authDeleted++;
}
console.log(`auth.users deleted: ${authDeleted}, failed: ${authFailed}`);

// Hide the two kept talent profiles from public/Explore.
await step("hide maya-khaled + nour-hassan (status=pending)", async () => {
  const keepIds = profiles.filter(p => ["maya-khaled", "nour-hassan"].includes(p.handle)).map(p => p.id);
  return admin.from("talent_profiles").update({ status: "pending" }).in("user_id", keepIds).select("id", { count: "exact" });
});

console.log("\n=== AFTER ===");
for (const t of ["profiles", "talent_profiles", "brand_profiles", "bookings", "booking_briefs", "reviews", "community_questions", "community_answers", "jobs", "job_applications", "portfolio_items", "conversations", "messages"]) {
  console.log(`${t}: ${await countTable(t)}`);
}
