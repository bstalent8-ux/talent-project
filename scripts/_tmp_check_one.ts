// READ-ONLY — full look at one profile, to help judge test vs real.
// Run: npx tsx scripts/_tmp_check_one.ts <handle>
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const handle = process.argv[2];

async function main() {
  const { data: profile } = await db.from("profiles").select("*").eq("handle", handle).maybeSingle();
  console.log("=== profile ===");
  console.log(JSON.stringify(profile, null, 2));
  if (!profile) return;

  const { data: tp } = await db.from("talent_profiles").select("*").eq("user_id", profile.id).maybeSingle();
  console.log("=== talent_profiles ===");
  console.log(JSON.stringify(tp, null, 2));

  const { data: auth } = await db.auth.admin.getUserById(profile.id);
  console.log("=== auth.users ===");
  console.log(JSON.stringify({
    email: auth?.user?.email, phone: auth?.user?.phone,
    last_sign_in_at: auth?.user?.last_sign_in_at, created_at: auth?.user?.created_at,
    user_metadata: auth?.user?.user_metadata,
  }, null, 2));

  const { data: events } = await db.from("user_events").select("event_name, created_at, metadata").eq("user_id", profile.id).order("created_at");
  console.log(`=== user_events (${events?.length ?? 0}) ===`);
  console.log(JSON.stringify(events, null, 2));
}
main();
