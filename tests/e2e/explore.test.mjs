import assert from "node:assert/strict";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local", quiet: true });

const BASE_URL = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";

function requireEnv(name) {
  const value = process.env[name];
  assert.ok(value, `${name} is required`);
  return value;
}

const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
const admin = createClient(supabaseUrl, serviceKey);

async function fetchApprovedTalents() {
  const { data, error } = await admin
    .from("profiles")
    .select(`
      id, handle, full_name, is_suspended,
      talent_profiles!inner (
        id, category, specialties, status
      )
    `)
    .eq("role", "talent")
    .eq("is_suspended", false)
    .not("handle", "is", null)
    .eq("talent_profiles.status", "approved")
    .limit(12);

  assert.ifError(error);
  return data ?? [];
}

async function request(path, init = {}) {
  return fetch(new URL(path, BASE_URL), {
    redirect: "follow",
    ...init,
    headers: {
      ...(init.headers || {}),
    },
  });
}

const talents = await fetchApprovedTalents();
assert.ok(talents.length > 0, "seeded database should contain approved, non-suspended talents");

const categories = new Set(
  talents
    .map((profile) => {
      const tp = Array.isArray(profile.talent_profiles)
        ? profile.talent_profiles[0]
        : profile.talent_profiles;
      return tp?.category;
    })
    .filter(Boolean),
);
assert.ok(categories.size > 0, "approved talents should return categories");

const guestExplore = await request("/explore");
assert.equal(guestExplore.status, 200, `/explore should render for guests, got ${guestExplore.status}`);
const guestHtml = await guestExplore.text();
assert.ok(
  guestHtml.includes('href="/talent/'),
  "/explore should render talent card links for guests",
);

if (process.env.E2E_AUTH_COOKIE) {
  const authedExplore = await request("/explore", {
    headers: { Cookie: process.env.E2E_AUTH_COOKIE },
  });
  assert.equal(authedExplore.status, 200, `/explore should render for authenticated users, got ${authedExplore.status}`);
  const authedHtml = await authedExplore.text();
  assert.ok(
    authedHtml.includes('href="/talent/'),
    "authenticated /explore should render talent cards",
  );
} else if (process.env.E2E_TALENT_EMAIL && process.env.E2E_TALENT_PASSWORD) {
  const anon = createClient(supabaseUrl, requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"));
  const { error } = await anon.auth.signInWithPassword({
    email: process.env.E2E_TALENT_EMAIL,
    password: process.env.E2E_TALENT_PASSWORD,
  });
  assert.ifError(error);

  console.log("Authenticated browser Explore E2E skipped: set E2E_AUTH_COOKIE to exercise SSR cookies. Seeded talent credentials were validated.");
} else {
  console.log("Authenticated Explore E2E skipped: set E2E_AUTH_COOKIE or E2E_TALENT_EMAIL/PASSWORD against a seeded environment.");
}

console.log("Explore E2E passed.");
