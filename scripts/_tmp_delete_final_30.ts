// All dependent data is already cleaned (scripts/_tmp_cleanup_only.ts ran
// successfully). This just removes the auth user + profiles row for each
// remaining pre-Aug25 account. Run: npx tsx scripts/_tmp_delete_final_30.ts
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const KEEP_HANDLES = new Set(["maya-khaled", "nour-hassan", "andrew-sherif"]);
const CUTOFF = "2026-08-25T00:00:00Z";

async function main() {
  const { data: profiles } = await db
    .from("profiles")
    .select("id, handle, role, created_at")
    .lt("created_at", CUTOFF)
    .order("created_at", { ascending: true });

  const targets = (profiles ?? []).filter((p) => p.role !== "admin" && !KEEP_HANDLES.has(p.handle ?? ""));
  console.log(`Deleting ${targets.length} accounts.\n`);

  for (const p of targets) {
    const { error } = await db.auth.admin.deleteUser(p.id);
    if (!error) { console.log(`deleted ${p.handle}`); continue; }
    if (String(error.message ?? "").toLowerCase().includes("not found")) {
      const { error: profErr } = await db.from("profiles").delete().eq("id", p.id);
      console.log(profErr ? `FAILED (orphan) ${p.handle} -> ${profErr.message}` : `deleted (orphan) ${p.handle}`);
    } else {
      console.log(`FAILED ${p.handle} -> ${error.message}`);
    }
  }
}
main();
