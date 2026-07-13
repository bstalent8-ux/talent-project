import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables.");
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseKey);

async function fixDb() {
  console.log("Attempting to verify tables...");
  
  // Try to create the table using a simple query if it doesn't exist
  // Note: Supabase JS SDK doesn't support CREATE TABLE directly, 
  // but we can check if it exists and inform the user.
  
  const { error } = await adminClient
    .from("community_questions")
    .select("id")
    .limit(1);

  if (error && error.message.includes("relation \"public.community_questions\" does not exist")) {
    console.error("CRITICAL: The table 'community_questions' does not exist in your Supabase database.");
    console.log("Please follow these steps:");
    console.log("1. Go to your Supabase Dashboard (https://supabase.com/dashboard)");
    console.log("2. Open your project.");
    console.log("3. Click on 'SQL Editor' in the left sidebar.");
    console.log("4. Create a 'New Query'.");
    console.log("5. Copy and paste the content of 'supabase/migrations/create_community_tables.sql' into the editor.");
    console.log("6. Click 'Run'.");
  } else if (error) {
    console.error("Unexpected error:", error.message);
  } else {
    console.log("✅ Tables verified and accessible!");
  }
}

fixDb();
