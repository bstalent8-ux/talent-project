import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// ─── STATIC assertions on the migration's SQL TEXT only ───────────────────────
// This is not a database integration test — there is no Postgres available
// in this vitest environment (node, no live connection), so nothing here
// executes a trigger, a backfill, or an INSERT against a real
// talent_category enum or profile_categories table. What it guards against
// is a regression of the two concrete bugs this file already had:
//   v1 — a FOREIGN KEY across the talent_profiles.category enum /
//        categories.id text boundary (ERROR 42804, impossible).
//   v2 — INSERT ... ON CONFLICT (profile_id, category_id), which assumes a
//        composite unique constraint that was never confirmed to exist and
//        is the leading suspect for why the backfill silently failed to
//        close the known drift row.
// Real verification that the trigger/backfill behave correctly against live
// data is the SQL Editor verification block at the end of this migration
// file, run against the actual production database — see the handoff
// report, not this test.
const sql = readFileSync(
  fileURLToPath(new URL("./20260812_02_talent_category_fk_sync.sql", import.meta.url)),
  "utf-8",
);

describe("20260812_02_talent_category_fk_sync.sql — static regression guards", () => {
  it("never creates a FOREIGN KEY from talent_profiles.category to categories (v1 bug)", () => {
    expect(sql).not.toMatch(/ADD CONSTRAINT\s+talent_profiles_category_fkey/i);
    expect(sql).not.toMatch(/FOREIGN KEY\s*\(category\)\s*REFERENCES\s+public\.categories/i);
  });

  it("never uses ON CONFLICT (profile_id, category_id) (v2 bug)", () => {
    expect(sql).not.toMatch(/ON CONFLICT\s*\(\s*profile_id\s*,\s*category_id\s*\)/i);
  });

  it("uses an explicit existence check before inserting into profile_categories, in both the trigger and the backfill", () => {
    const occurrences = sql.match(/IF NOT EXISTS\s*\(\s*SELECT 1 FROM public\.profile_categories/gi) ?? [];
    expect(occurrences.length).toBe(2); // sync_talent_category_to_profile_categories() + the backfill loop
  });

  it("defines each sync/validation trigger exactly once, guarded by DROP TRIGGER IF EXISTS", () => {
    for (const trigger of ["trg_validate_talent_profiles_category", "trg_sync_talent_category"]) {
      const drops = sql.match(new RegExp(`DROP TRIGGER IF EXISTS\\s+${trigger}\\b`, "gi")) ?? [];
      const creates = sql.match(new RegExp(`CREATE TRIGGER\\s+${trigger}\\b`, "gi")) ?? [];
      expect(drops.length).toBe(1);
      expect(creates.length).toBe(1);
    }
  });

  it("pins search_path on every SECURITY DEFINER function it defines", () => {
    const functionBlocks = sql.split(/CREATE OR REPLACE FUNCTION/i).slice(1);
    expect(functionBlocks.length).toBeGreaterThan(0);
    for (const block of functionBlocks) {
      if (/SECURITY DEFINER/i.test(block)) {
        expect(block).toMatch(/SET search_path = public, pg_temp/i);
      }
    }
  });

  it("filters every profile_categories DELETE/EXISTS check to role_type = 'talent'", () => {
    // Regression guard for the Phase 5 semantics decision: this file must
    // never touch a brand-role profile_categories row.
    const deleteBlocks = sql.split(/DELETE FROM public\.profile_categories/i).slice(1);
    expect(deleteBlocks.length).toBeGreaterThan(0);
    for (const block of deleteBlocks) {
      expect(block.slice(0, 400)).toMatch(/role_type\s*=\s*'talent'/i);
    }
  });

  it("recomputes the known-drift verification against the specific reported production row", () => {
    expect(sql).toMatch(/d0f50259-cd73-4a28-9dd9-90dab1b43c46/);
  });
});
