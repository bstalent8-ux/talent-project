import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkOne(handle: string) {
  const { data: p } = await admin.from("profiles").select("id").eq("handle", handle).maybeSingle();
  if (!p) { console.log(handle, "-> GONE"); return; }
  const uid = p.id;
  const { data: tp } = await admin.from("talent_profiles").select("id").eq("user_id", uid).maybeSingle();
  const tpid = tp?.id;
  const checks: [string,string,string][] = [
    ["bookings","brand_id",uid],["bookings","talent_user_id",uid],
    ["reviews","brand_id",uid],["jobs","brand_id",uid],
    ["conversations","brand_id",uid],["messages","sender_id",uid],
    ["notifications","recipient_id",uid],["notifications","sender_id",uid],
    ["user_events","user_id",uid],["subscriptions","user_id",uid],
    ["user_usage","user_id",uid],["profile_categories","profile_id",uid],
    ["favorites","user_id",uid],["favorites","talent_user_id",uid],
  ];
  if (tpid) {
    checks.push(["bookings","talent_id",tpid],["reviews","talent_id",tpid] as any,
      ["portfolio_items","talent_id",tpid],["talent_brands","talent_profile_id",tpid]);
  }
  const hits: string[] = [];
  for (const [t,c,v] of checks) {
    try {
      const { count, error } = await admin.from(t).select("id",{count:"exact",head:true}).eq(c,v);
      if (error) hits.push(`${t}.${c}=ERR:${error.message.slice(0,50)}`);
      else if ((count??0)>0) hits.push(`${t}.${c}=${count}`);
    } catch(e:any){ hits.push(`${t}.${c}=EXC`); }
  }
  console.log(handle, "|", hits.join(", ")||"NOTHING LEFT");
}
async function main(){
  const { data } = await admin.from("profiles").select("handle").lt("created_at","2026-08-25T00:00:00Z").not("role","eq","admin").not("handle","in",'("maya-khaled","nour-hassan","andrew-sherif")');
  console.log("remaining:", data?.length);
  for (const r of data ?? []) await checkOne(r.handle!);
}
main();
