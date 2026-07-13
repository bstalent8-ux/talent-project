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

async function finalCheck() {
  console.log("--- Final Check ---");
  
  // 1. Check Tables
  const { data: questions, error: qError } = await adminClient
    .from("community_questions")
    .select("id, title, views");
  
  if (qError) {
    console.log("❌ community_questions error:", qError.message);
  } else {
    console.log(`✅ community_questions has ${questions.length} rows.`);
  }

  const { data: answers, error: aError } = await adminClient
    .from("community_answers")
    .select("id, content");
  
  if (aError) {
    console.log("❌ community_answers error:", aError.message);
  } else {
    console.log(`✅ community_answers has ${answers.length} rows.`);
  }

  console.log("--- End of Check ---");
}

finalCheck();
