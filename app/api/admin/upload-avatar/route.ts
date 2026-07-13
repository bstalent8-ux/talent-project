import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await adminClient
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Parse file from form data
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `avatars/admin-${user.id}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  // Upload using service role — bypasses RLS entirely
  const { error: upErr } = await adminClient.storage
    .from("avatars")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data: { publicUrl } } = adminClient.storage.from("avatars").getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
