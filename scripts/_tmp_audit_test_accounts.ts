import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const ACCOUNTS: Record<string, string> = {
  "maya.khaled@talents-test.com": "maya-khaled",
  "nour.hassan@talents-test.com": "nour-hassan",
  "layla.ahmed@talents-test.com": "layla-ahmed",
  "sara.mostafa@talents-test.com": "sara-mostafa",
  "rana.tarek@talents-test.com": "rana-tarek",
  "ahmed.brands@talents-test.com": "ahmed-brands",
  "sara.marketing@talents-test.com": "sara-marketing",
  "omar.digital@talents-test.com": "omar-digital",
  "mona.agency@talents-test.com": "mona-agency",
  "youssef.corp@talents-test.com": "youssef-corp",
};

async function main() {
  const { data: list } = await db.auth.admin.listUsers({ perPage: 200 });
  const users = list?.users ?? [];

  for (const [email, handle] of Object.entries(ACCOUNTS)) {
    const authUser = users.find((u) => u.email === email);
    const { data: profile } = await db.from("profiles").select("id, handle, role").eq("handle", handle).maybeSingle();

    if (!authUser) { console.log(handle, "-> NO AUTH USER (email not found)"); continue; }
    if (!profile) { console.log(handle, "-> NO PROFILE ROW (handle not found)"); continue; }

    const matches = authUser.id === profile.id;
    console.log(
      handle,
      matches ? "OK" : "BROKEN",
      "auth.id=" + authUser.id,
      "profile.id=" + profile.id,
    );
  }
}
main();
