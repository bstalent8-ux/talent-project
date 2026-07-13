import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").select("id").limit(1);

  if (error) {
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "ok", message: "Supabase connected" });
}
