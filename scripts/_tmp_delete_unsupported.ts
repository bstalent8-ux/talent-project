import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// 11 legacy category="fashion" accounts that are actually actor/host-typed
// (not ugc/model) or a dead test signup — confirmed via prior read-only
// audit. Ordered children-first so nothing is left orphaned if a step fails.
const ACCOUNTS = [
  { handle: "ola-actor",    profileId: "4681aa2e-9a8d-47e1-ac17-1d74989d9795", tpId: "f286ada3-957f-445e-9e3f-a27151108bc7" },
  { handle: "sameh-host",   profileId: "13151e35-ac2c-4647-95f9-dc2285da5938", tpId: "9ef841da-b909-484d-ab4b-2ca65fea94d1" },
  { handle: "ghada-host",   profileId: "d22e1945-5ddf-4b84-9358-5ec30019ba45", tpId: "6c2960b8-2d85-4554-95c5-150ab47808df" },
  { handle: "bassem-actor", profileId: "3ee8cf1e-81f4-4465-a01a-f634154e67a2", tpId: "59a5cb94-ebde-404f-b1dd-f55d73447699" },
  { handle: "dalia-host",   profileId: "9c786b80-53ff-4e5b-bb07-471313296de6", tpId: "0a365fb7-3e57-4ea4-918a-b8bce1c6630d" },
  { handle: "magdy-actor",  profileId: "2a461094-99e8-4288-83c1-38229d0b9633", tpId: "1f15ab57-bcb8-4514-9cd5-9e6a5e90708c" },
  { handle: "bstalent82",   profileId: "de302140-9cb8-4b13-9b0b-e51fda3ff2f7", tpId: "8cd9f513-70aa-4bd5-9ead-4e7b1d157cef" },
  { handle: "nadia-actor",  profileId: "31b4ff50-7ab0-4e4e-bc0b-d85573916684", tpId: "0a611871-ca8f-4ae2-bddc-d83768e43455" },
  { handle: "mostafa-host", profileId: "1d9794c0-3c36-4f21-ba27-111bfb10be8b", tpId: "a39ffdd4-9c37-4348-9742-90a80a190af1" },
  { handle: "hany-host",    profileId: "a65e1b18-2a1b-42ce-8f8b-bae44c32083e", tpId: "d51eef93-9766-4d00-9f4a-577d3c581770" },
  { handle: "ziad-actor",   profileId: "4560825e-b16d-4dbc-861f-a40e5cae82a7", tpId: "6452399c-04e8-4921-8c70-a179306fbcef" },
];

const profileIds = ACCOUNTS.map(a => a.profileId);
const tpIds = ACCOUNTS.map(a => a.tpId);

async function step(label: string, fn: () => Promise<{ error: unknown; count: number | null }>) {
  const { error, count } = await fn();
  console.log(`${label} -> ${error ? "ERROR: " + JSON.stringify(error) : `ok (${count ?? "?"} rows)`}`);
  if (error) throw new Error(`Aborting at "${label}": ${JSON.stringify(error)}`);
}

async function main() {
  console.log("=== PRE-CHECK: recount dependents for these 11 accounts ===");
  for (const table of ["bookings", "reviews", "portfolio_items", "talent_verifications", "talent_brands"] as const) {
    const col = table === "talent_brands" ? "talent_profile_id" : "talent_id";
    const { count } = await admin.from(table).select("*", { count: "exact", head: true }).in(col, tpIds);
    console.log(`  ${table}: ${count}`);
  }
  const { count: convCount } = await admin.from("conversations").select("*", { count: "exact", head: true }).in("talent_id", tpIds);
  console.log(`  conversations: ${convCount}`);
  const { count: jaCount } = await admin.from("job_applications").select("*", { count: "exact", head: true }).in("talent_id", tpIds);
  console.log(`  job_applications: ${jaCount}`);

  console.log("\n=== DELETING (children first) ===");
  await step("reviews",              () => admin.from("reviews").delete({ count: "exact" }).in("talent_id", tpIds));
  await step("bookings",             () => admin.from("bookings").delete({ count: "exact" }).in("talent_id", tpIds));
  await step("portfolio_items",      () => admin.from("portfolio_items").delete({ count: "exact" }).in("talent_id", tpIds));
  await step("talent_verifications", () => admin.from("talent_verifications").delete({ count: "exact" }).in("talent_id", tpIds));
  await step("talent_brands",        () => admin.from("talent_brands").delete({ count: "exact" }).in("talent_profile_id", tpIds));
  await step("conversations",        () => admin.from("conversations").delete({ count: "exact" }).in("talent_id", tpIds));
  await step("job_applications",     () => admin.from("job_applications").delete({ count: "exact" }).in("talent_id", tpIds));
  await step("talent_profiles",      () => admin.from("talent_profiles").delete({ count: "exact" }).in("id", tpIds));
  await step("profiles",             () => admin.from("profiles").delete({ count: "exact" }).in("id", profileIds));

  console.log("\n=== auth.users ===");
  for (const a of ACCOUNTS) {
    const { error } = await admin.auth.admin.deleteUser(a.profileId);
    console.log(`  ${a.handle} (${a.profileId}) -> ${error ? "ERROR: " + error.message : "deleted"}`);
  }

  console.log("\n=== POST-CHECK ===");
  const { data: remainingTp } = await admin.from("talent_profiles").select("category").in("id", tpIds);
  console.log("remaining talent_profiles rows for these ids (should be empty):", JSON.stringify(remainingTp));
  const { count: fashionLeft } = await admin.from("talent_profiles").select("*", { count: "exact", head: true }).eq("category", "fashion");
  console.log("talent_profiles with category='fashion' remaining (should be 0):", fashionLeft);
  const { count: talentRoleCount } = await admin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "talent");
  console.log("profiles role=talent count now (was 57):", talentRoleCount);
}
main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
