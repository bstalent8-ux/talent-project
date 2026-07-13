import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";

const ADMINS = [
  { email: "admin@talents-platform.com", password: "Admin@2024!", full_name: "Admin One",   handle: "admin-1" },
  { email: "admin2@talents-platform.com", password: "Admin@2024!", full_name: "Admin Two",  handle: "admin-2" },
];

export async function POST() {
  const results: Record<string, string> = {};

  for (const admin of ADMINS) {
    // Create auth user
    const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
      email: admin.email,
      password: admin.password,
      email_confirm: true,
    });

    if (authErr && !authErr.message.includes("already been registered")) {
      results[admin.email] = `auth error: ${authErr.message}`;
      continue;
    }

    const userId = authData?.user?.id;

    // Upsert profile with role=admin
    if (userId) {
      const { error: profileErr } = await adminClient
        .from("profiles")
        .upsert(
          { id: userId, full_name: admin.full_name, handle: admin.handle, role: "admin" },
          { onConflict: "id" }
        );

      if (profileErr) {
        results[admin.email] = `profile error: ${profileErr.message}`;
      } else {
        results[admin.email] = "✅ created";
      }
    } else {
      // User already exists — update role
      const { data: existing } = await adminClient
        .from("profiles")
        .select("id")
        .eq("handle", admin.handle)
        .maybeSingle();

      if (existing) {
        await adminClient.from("profiles").update({ role: "admin" }).eq("id", existing.id);
        results[admin.email] = "✅ role updated to admin";
      } else {
        results[admin.email] = "⚠️ user exists in auth but profile not found";
      }
    }
  }

  return NextResponse.json({ results });
}
