import assert from "node:assert/strict";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local", quiet: true });

const BASE_URL = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";

function projectRefFromUrl(url) {
  return new URL(url).hostname.split(".")[0];
}

function sessionCookie(session) {
  const ref = projectRefFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const encoded = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  return `sb-${ref}-auth-token=base64-${encoded}`;
}

async function requestRole(cookie) {
  return fetch(new URL("/api/me/role", BASE_URL), {
    redirect: "manual",
    headers: cookie ? { Cookie: cookie } : {},
  });
}

const guestResponse = await requestRole();
assert.equal(guestResponse.status, 200, `/api/me/role should return guest state with 200, got ${guestResponse.status}`);
const guest = await guestResponse.json();
assert.deepEqual(
  {
    role: guest.role,
    id: guest.id,
    account_status: guest.account_status,
    brand_status: guest.brand_status,
    is_suspended: guest.is_suspended,
    talent_status: guest.talent_status,
    is_guest: guest.is_guest,
  },
  {
    role: null,
    id: null,
    account_status: null,
    brand_status: null,
    is_suspended: null,
    talent_status: null,
    is_guest: true,
  },
);

let cookie = process.env.E2E_AUTH_COOKIE || "";

if (!cookie && process.env.E2E_TALENT_EMAIL && process.env.E2E_TALENT_PASSWORD) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const { data, error } = await supabase.auth.signInWithPassword({
    email: process.env.E2E_TALENT_EMAIL,
    password: process.env.E2E_TALENT_PASSWORD,
  });

  assert.ifError(error);
  assert.ok(data.session, "seeded login should return a Supabase session");
  cookie = sessionCookie(data.session);
}

if (cookie) {
  const authedResponse = await requestRole(cookie);
  assert.equal(authedResponse.status, 200, `/api/me/role should return authenticated state with 200, got ${authedResponse.status}`);
  const authed = await authedResponse.json();
  assert.ok(authed.id, "authenticated /api/me/role should return user id");
  assert.ok(["talent", "brand", "admin", "client", "ugc", "freelancer"].includes(authed.role), `unexpected role ${authed.role}`);
  assert.notEqual(authed.is_guest, true, "authenticated /api/me/role should not be guest");
} else {
  console.log("Authenticated /api/me/role E2E skipped: set E2E_AUTH_COOKIE or E2E_TALENT_EMAIL/PASSWORD.");
}

console.log("/api/me/role E2E passed.");
