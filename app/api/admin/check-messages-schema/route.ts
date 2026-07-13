import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";

export async function GET() {
  // Check actual columns via information_schema
  const { data: colData, error: colErr } = await adminClient
    .from("information_schema.columns" as never)
    .select("column_name, data_type, is_nullable")
    .eq("table_schema", "public")
    .eq("table_name", "messages")
    .order("ordinal_position");

  // Try fetching with the expected schema
  const { data, error } = await adminClient
    .from("messages")
    .select("id, conversation_id, sender_id, content, message_type, created_at, is_read")
    .limit(3);

  // Try fetching conversations too
  const { data: convs, error: convErr } = await adminClient
    .from("conversations")
    .select("*")
    .limit(3);

  return NextResponse.json({
    columns_from_schema: colData ?? [],
    columns_error: colErr?.message ?? null,
    messages_error: error?.message ?? null,
    messages_sample: data ?? [],
    conversations_error: convErr?.message ?? null,
    conversations_sample: convs ?? [],
    conversations_columns: convs?.[0] ? Object.keys(convs[0]) : [],
  });
}
