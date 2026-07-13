import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";

export async function POST() {
  const steps: Record<string, string> = {};

  // 1. Add status column
  const { error: e1 } = await adminClient.rpc("exec_sql" as never, {
    sql: `ALTER TABLE talent_profiles ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'`
  } as never);
  steps["add_status"] = e1 ? `error: ${e1.message}` : "ok";

  // 2. Add approved_at
  const { error: e2 } = await adminClient.rpc("exec_sql" as never, {
    sql: `ALTER TABLE talent_profiles ADD COLUMN IF NOT EXISTS approved_at timestamptz`
  } as never);
  steps["add_approved_at"] = e2 ? `error: ${e2.message}` : "ok";

  // 3. Add approved_by
  const { error: e3 } = await adminClient.rpc("exec_sql" as never, {
    sql: `ALTER TABLE talent_profiles ADD COLUMN IF NOT EXISTS approved_by uuid`
  } as never);
  steps["add_approved_by"] = e3 ? `error: ${e3.message}` : "ok";

  // 4. Add rejection_reason
  const { error: e4 } = await adminClient.rpc("exec_sql" as never, {
    sql: `ALTER TABLE talent_profiles ADD COLUMN IF NOT EXISTS rejection_reason text`
  } as never);
  steps["add_rejection_reason"] = e4 ? `error: ${e4.message}` : "ok";

  // 5. Set all existing to approved
  const { error: e5 } = await adminClient.rpc("exec_sql" as never, {
    sql: `UPDATE talent_profiles SET status = 'approved' WHERE status = 'pending'`
  } as never);
  steps["approve_existing"] = e5 ? `error: ${e5.message}` : "ok";

  return NextResponse.json({ steps });
}
