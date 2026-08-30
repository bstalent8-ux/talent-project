// The 3 accounts below are fully cleaned of dependent data already
// (notifications, user_events, profile_categories, talent_type_requests,
// portfolio_items, talent_profiles) — this just removes the auth user +
// profiles row. Run: npx tsx scripts/_tmp_delete_final_3.ts
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const IDS: [string, string][] = [
  ["decore-stores-eg", "d06ab766-a54b-4897-8fd0-719eff4c269f"],
  ["test123", "91eed2b0-e77e-46ee-b3f7-e7f68d121cc7"],
  ["alaa", "b20eff37-37da-4593-bcd5-56bc7fddc554"],
];

async function main() {
  for (const [handle, uid] of IDS) {
    const { error } = await db.auth.admin.deleteUser(uid);
    console.log(error ? `FAILED ${handle} -> ${error.message}` : `deleted ${handle}`);
  }
}
main();
