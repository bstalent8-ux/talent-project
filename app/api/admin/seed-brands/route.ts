import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";

const PASSWORD = "Brand@2024!";

const BRANDS = [
  { email: "noon@brands-test.com",    full_name: "Noon Egypt",         handle: "noon-egypt",      city: "القاهرة" },
  { email: "zara@brands-test.com",    full_name: "Zara Egypt",         handle: "zara-egypt",      city: "القاهرة" },
  { email: "samsung@brands-test.com", full_name: "Samsung MENA",       handle: "samsung-mena",    city: "دبي"     },
  { email: "loreal@brands-test.com",  full_name: "L'Oréal Middle East",handle: "loreal-me",       city: "القاهرة" },
  { email: "uber@brands-test.com",    full_name: "Uber Eats Egypt",    handle: "uber-eats-egypt", city: "القاهرة" },
];

export async function GET() {
  const results: Record<string, string> = {};

  for (const brand of BRANDS) {
    // 1. Create auth user
    const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
      email: brand.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: brand.full_name, role: "brand" },
    });

    if (authErr && !authErr.message.includes("already been registered")) {
      results[brand.handle] = `auth error: ${authErr.message}`;
      continue;
    }

    const userId = authData?.user?.id ?? (
      // user already exists — fetch id
      (await adminClient.auth.admin.listUsers({ perPage: 1000 }))
        .data?.users?.find((u: { email?: string; id: string }) => u.email === brand.email)?.id
    );

    if (!userId) { results[brand.handle] = "could not resolve user id"; continue; }

    // 2. Upsert profile
    const { error: profileErr } = await adminClient
      .from("profiles")
      .upsert({
        id:        userId,
        role:      "brand",
        full_name: brand.full_name,
        handle:    brand.handle,
        city:      brand.city,
        is_approved: true,
      }, { onConflict: "id" });

    results[brand.handle] = profileErr ? `profile error: ${profileErr.message}` : "✓ created";
  }

  return NextResponse.json({
    password: PASSWORD,
    brands: BRANDS.map(b => ({ email: b.email, handle: b.handle, full_name: b.full_name })),
    results,
  });
}
