import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables.");
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log("Checking tables for:", supabaseUrl);
  
  const { data: profiles, error: pError } = await adminClient
    .from("profiles")
    .select("id, full_name, role")
    .limit(5);

  if (pError) {
    console.error("Error fetching profiles:", pError.message);
  } else {
    console.log("profiles table exists. Samples:", profiles);
  }
}

checkTables();
