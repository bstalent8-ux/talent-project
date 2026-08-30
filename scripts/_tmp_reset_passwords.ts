// Resets the password for the 7 kept pre-Aug25 accounts (andrew-sherif,
// maya-khaled, nour-hassan, and all 4 admins). Does NOT touch any account
// created after 2026-08-25 (real users) — the account list is a fixed,
// hand-picked set, not date-based, so there's nothing to accidentally widen.
//
// Writes results (handle, email, role, new password) to
// scripts/_tmp_password_reset_results.json — a single file, as asked.
// Delete that file once you've copied the passwords somewhere safe.
//
// Run: npx tsx scripts/_tmp_reset_passwords.ts

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as crypto from "crypto";
import * as fs from "fs";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

function genPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  let out = "";
  for (let i = 0; i < 16; i++) out += chars[crypto.randomInt(chars.length)];
  return out;
}

const ACCOUNTS = [
  { handle: "andrew-sherif",        id: "b40e1929-a834-4507-b8d8-35ee6b0f5b2b", email: "andrewsherif2013@gmail.com",        role: "Talent (kept, hidden from Explore)" },
  { handle: "maya-khaled",          id: "6ad8b09e-62b4-4efd-b3b1-498714b75098", email: "maya.khaled@talents-test.com",       role: "Talent (layout test)" },
  { handle: "nour-hassan",          id: "e58de4fc-ed33-4579-bd6a-3ad431ffb3ca", email: "nour.hassan@talents-test.com",       role: "Talent (layout test)" },
  { handle: "admin-1",              id: "fb9bc5ca-a537-4bfd-ad98-2baeccf89b32", email: "admin@talents-platform.com",         role: "Admin" },
  { handle: "admin-2",              id: "8f4db2ad-5c90-48ae-b6cb-dab3e1590fbc", email: "admin2@talents-platform.com",        role: "Admin" },
  { handle: "ahmed-brands",         id: "bc75f4ea-9568-4148-bf6f-f9630988d468", email: "ahmed.brands@talents-test.com",      role: "Admin" },
  { handle: "qa-admin-1786881466",  id: "1381e110-6627-4e9e-ac30-2463f6b17714", email: "qa.admin.1786881466@mailinator.com", role: "Admin (QA)" },
];

async function main() {
  const results: Record<string, unknown>[] = [];
  for (const acc of ACCOUNTS) {
    const password = genPassword();
    const { error } = await admin.auth.admin.updateUserById(acc.id, { password });
    const status = error ? `FAILED: ${error.message}` : "OK";
    console.log(acc.handle, status);
    results.push({ handle: acc.handle, email: acc.email, role: acc.role, password: error ? null : password, status });
  }
  const outPath = path.resolve(process.cwd(), "scripts/_tmp_password_reset_results.json");
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log("\nWritten to", outPath);
}
main();
