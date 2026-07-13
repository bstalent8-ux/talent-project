import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// Load .env.local manually
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => l.split("=").map((s) => s.trim()))
);

const c = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await c.from("profiles").select("id, full_name, role").limit(5);
  if (error) {
    console.error(error);
  } else {
    console.log("Profiles in DB:", data);
  }
}

test().catch(console.error);
