export const runtime = 'edge';

import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";

export async function GET() {
  // Query information_schema to find what job_applications_job_id_fkey actually references
  const { data: fkInfo, error: fkErr } = await adminClient.rpc("get_fk_info" as never);

  // Fallback: query information_schema.referential_constraints via a raw SQL workaround
  // Use select on information_schema views (PostgREST exposes them with service role)
  const { data: constraints, error: cErr } = await adminClient
    .from("information_schema.table_constraints" as never)
    .select("constraint_name, table_name, constraint_type")
    .eq("table_name" as never, "job_applications" as never);

  // Also check key_column_usage
  const { data: keyUsage, error: kuErr } = await adminClient
    .from("information_schema.key_column_usage" as never)
    .select("constraint_name, column_name, table_name")
    .eq("table_name" as never, "job_applications" as never);

  // And referential_constraints to find what it references
  const { data: refConstraints, error: rcErr } = await adminClient
    .from("information_schema.referential_constraints" as never)
    .select("constraint_name, unique_constraint_name")
    .eq("constraint_name" as never, "job_applications_job_id_fkey" as never);

  return NextResponse.json({
    fk_rpc: fkInfo ?? fkErr?.message,
    constraints: constraints ?? cErr?.message,
    key_usage: keyUsage ?? kuErr?.message,
    ref_constraints: refConstraints ?? rcErr?.message,
  });
}