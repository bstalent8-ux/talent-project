// READ-ONLY audit — reviews + contact_messages ("support tickets"), flagged
// against the same test-account set found in _tmp_audit_users_for_cleanup.ts.
// Does not touch the database. Run: npx tsx scripts/_tmp_audit_reviews_tickets.ts
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const TEST_EMAIL_PATTERNS = [
  "@talents-test.com", "@talents-seed.com", "@brands-test.com", "@example.com",
  "@mailinator.com", "@talents.local", "@talents-platform.com",
];
const KNOWN_TEST_HANDLES = new Set(["decore-stores-eg", "admin-1", "admin-2"]);
const KNOWN_REAL_HANDLES = new Set(["joyadel2005", "andrew-sherif"]);

function isTestEmail(email: string) {
  return TEST_EMAIL_PATTERNS.some((p) => email.endsWith(p));
}

async function main() {
  const { data: authList } = await db.auth.admin.listUsers({ perPage: 1000 });
  const emailById = new Map((authList?.users ?? []).map((u) => [u.id, u.email ?? ""]));
  const { data: profiles } = await db.from("profiles").select("id, handle");
  const handleById = new Map((profiles ?? []).map((p) => [p.id, p.handle ?? ""]));

  function verdictFor(userId: string | null | undefined) {
    if (!userId) return "REVIEW";
    const handle = handleById.get(userId) ?? "";
    const email = emailById.get(userId) ?? "";
    if (KNOWN_REAL_HANDLES.has(handle)) return "REAL";
    if (KNOWN_TEST_HANDLES.has(handle) || isTestEmail(email)) return "TEST";
    return "REVIEW";
  }

  console.log("=== REVIEWS ===");
  const { data: reviews, error: reviewsErr } = await db
    .from("reviews")
    .select("id, brand_id, talent_id, rating, comment, status, review_type, created_at")
    .order("created_at", { ascending: true });
  if (reviewsErr) console.log("reviews query error:", reviewsErr.message);

  const tally = { TEST: 0, REAL: 0, REVIEW: 0 };
  for (const r of reviews ?? []) {
    const v = verdictFor(r.brand_id);
    tally[v as keyof typeof tally]++;
    console.log(
      v.padEnd(8),
      r.created_at.slice(0, 19).padEnd(20),
      String(r.rating).padEnd(3),
      (r.status ?? "").padEnd(10),
      (emailById.get(r.brand_id) || r.brand_id).padEnd(32),
      "->",
      (r.comment ?? "").slice(0, 40).replace(/\n/g, " "),
    );
  }
  console.log(`Reviews totals — TEST: ${tally.TEST}  REAL: ${tally.REAL}  REVIEW: ${tally.REVIEW}  (of ${reviews?.length ?? 0})`);

  console.log("\n=== CONTACT MESSAGES / SUPPORT TICKETS ===");
  const { data: msgs, error: msgsErr } = await db
    .from("contact_messages")
    .select("id, name, email, type, subject, status, created_at")
    .order("created_at", { ascending: true });
  if (msgsErr) console.log("contact_messages query error:", msgsErr.message);

  const mtally = { TEST: 0, REAL: 0, REVIEW: 0 };
  for (const m of msgs ?? []) {
    const v = isTestEmail(m.email) ? "TEST" : "REVIEW";
    mtally[v as keyof typeof mtally]++;
    console.log(
      v.padEnd(8),
      m.created_at.slice(0, 19).padEnd(20),
      (m.type ?? "").padEnd(10),
      (m.status ?? "").padEnd(10),
      m.email.padEnd(32),
      "->",
      (m.subject ?? "").slice(0, 40),
    );
  }
  console.log(`Contact/tickets totals — TEST: ${mtally.TEST}  REVIEW: ${mtally.REVIEW}  (of ${msgs?.length ?? 0})`);
}
main();
