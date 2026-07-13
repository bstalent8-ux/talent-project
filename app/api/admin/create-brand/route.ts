export const runtime = 'edge';

import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";

export async function POST() {
  const brand = {
    email:     "brand@talents-platform.com",
    password:  "Brand@2024!",
    full_name: "Youssef Corp Test",
    handle:    "youssef-corp-test",
    city:      "Cairo",
    bio:       "براند تجريبي لاختبار المنصة",
  };

  // Create auth user
  const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
    email:         brand.email,
    password:      brand.password,
    email_confirm: true,
  });

  if (authErr && !authErr.message.includes("already been registered")) {
    return NextResponse.json({ error: authErr.message }, { status: 400 });
  }

  const userId = authData?.user?.id;

  // If user already exists, find by email
  let finalId = userId;
  if (!finalId) {
    const { data: users } = await adminClient.auth.admin.listUsers();
    const existing = (users?.users ?? []).find((u: { email?: string }) => u.email === brand.email);
    finalId = existing?.id;
  }

  if (!finalId) return NextResponse.json({ error: "Could not get user id" }, { status: 500 });

  // Upsert profile with role=brand
  const { error: profileErr } = await adminClient.from("profiles").upsert({
    id:        finalId,
    full_name: brand.full_name,
    handle:    brand.handle,
    role:      "brand",
    city:      brand.city,
    bio:       brand.bio,
  }, { onConflict: "id" });

  if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 });

  return NextResponse.json({
    success: true,
    credentials: { email: brand.email, password: brand.password },
    user_id: finalId,
    role: "brand",
  });
}