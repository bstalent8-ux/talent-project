import assert from "node:assert/strict";

const BASE_URL = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";

const publicPaths = [
  "/",
  "/explore",
  "/talents",
  "/brands",
  "/jobs",
  "/campaigns",
  "/community",
  "/packages",
  "/pricing",
];

const protectedPaths = [
  "/dashboard",
  "/profile",
  "/profile/me",
  "/messages",
  "/chat",
  "/bookings",
  "/notifications",
  "/settings",
  "/payments",
  "/jobs/create",
  "/jobs/example/applications",
];

const protectedApis = [
  {
    method: "POST",
    path: "/api/jobs",
    body: { title: "Guest should not post" },
  },
  {
    method: "POST",
    path: "/api/bookings/direct",
    body: { talent_user_id: "00000000-0000-0000-0000-000000000000" },
  },
  {
    method: "POST",
    path: "/api/community/questions",
    body: { title: "Guest question", content: "Guest content" },
  },
  {
    method: "POST",
    path: "/api/community/answers",
    body: { question_id: "00000000-0000-0000-0000-000000000000", content: "Guest answer" },
  },
  {
    method: "GET",
    path: "/api/notifications",
  },
];

async function request(path, init = {}) {
  return fetch(new URL(path, BASE_URL), {
    redirect: "manual",
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
  });
}

for (const path of publicPaths) {
  const res = await request(path, { redirect: "follow" });
  assert.ok(res.status < 500, `${path} should be public and render without a server error, got ${res.status}`);
}

for (const path of protectedPaths) {
  const res = await request(path);
  assert.ok([301, 302, 303, 307, 308].includes(res.status), `${path} should redirect guests, got ${res.status}`);
  const location = res.headers.get("location") || "";
  assert.ok(location.includes("/login"), `${path} should redirect to /login, got ${location}`);
}

for (const api of protectedApis) {
  const res = await request(api.path, {
    method: api.method,
    body: api.body ? JSON.stringify(api.body) : undefined,
  });
  assert.equal(res.status, 401, `${api.method} ${api.path} should reject guests with 401`);
}

if (!process.env.E2E_TALENT_EMAIL || !process.env.E2E_BRAND_EMAIL) {
  console.log("Role E2E scenarios skipped: set E2E_TALENT_EMAIL/PASSWORD and E2E_BRAND_EMAIL/PASSWORD against a seeded environment.");
}

console.log("Guest permission E2E smoke passed.");
