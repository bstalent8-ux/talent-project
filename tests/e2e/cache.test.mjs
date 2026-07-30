import assert from "node:assert/strict";

const BASE_URL = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";

async function request(path, init = {}) {
  return fetch(new URL(path, BASE_URL), {
    redirect: "manual",
    ...init,
    headers: {
      ...(init.headers || {}),
    },
  });
}

function cacheControl(res) {
  return (res.headers.get("cache-control") || "").toLowerCase();
}

const role = await request("/api/me/role");
assert.equal(role.status, 200, `/api/me/role should return guest state with 200, got ${role.status}`);
assert.ok(cacheControl(role).includes("no-store"), "/api/me/role must not be shared-cacheable");

const jobs = await request("/api/jobs");
assert.equal(jobs.status, 200, `/api/jobs should return 200 for guests, got ${jobs.status}`);
assert.ok(cacheControl(jobs).includes("public"), "/api/jobs should be publicly cacheable");
assert.ok(cacheControl(jobs).includes("max-age=300"), "/api/jobs should use a 5 minute public cache");
assert.ok(cacheControl(jobs).includes("stale-while-revalidate=600"), "/api/jobs should advertise SWR");

const packages = await request("/api/packages");
assert.equal(packages.status, 200, `/api/packages should return 200 for guests, got ${packages.status}`);
assert.ok(cacheControl(packages).includes("public"), "/api/packages should be publicly cacheable");
assert.ok(cacheControl(packages).includes("max-age=3600"), "/api/packages should use a 1 hour public cache");

const bookings = await request("/api/bookings");
assert.equal(bookings.status, 401, `/api/bookings should reject guests with 401, got ${bookings.status}`);
assert.ok(cacheControl(bookings).includes("no-store"), "/api/bookings must not be shared-cacheable");

const notifications = await request("/api/notifications");
assert.equal(notifications.status, 401, `/api/notifications should reject guests with 401, got ${notifications.status}`);
assert.ok(cacheControl(notifications).includes("no-store"), "/api/notifications must not be shared-cacheable");

console.log("Cache header E2E passed.");
