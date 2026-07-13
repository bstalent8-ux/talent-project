import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables.");
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  const migrationFile = path.resolve(
    process.cwd(),
    "supabase/migrations/20260630_create_community_qa.sql"
  );

  const sql = fs.readFileSync(migrationFile, "utf-8");

  // Split by semicolons and execute each statement
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith("--"));

  console.log(`Found ${statements.length} SQL statements to execute.`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    try {
      const { error } = await adminClient.rpc("exec_sql", { sql: statement });
      if (error) {
        console.error(
          `[${i + 1}/${statements.length}] Error:`,
          statement.substring(0, 50),
          error
        );
      } else {
        console.log(`[${i + 1}/${statements.length}] ✓ Success`);
      }
    } catch (e: any) {
      console.error(
        `[${i + 1}/${statements.length}] Exception:`,
        e.message
      );
    }
  }

  console.log("Migration completed!");
}

runMigration();
