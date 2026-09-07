export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/require-admin";
import { requirePermission } from "@/lib/auth/permissions";
import { importCandidates } from "@/features/candidates/services/candidates.service";
import { csvRowsToRecords, mapRowToLeadIdentity, parseCsv, toSheetCsvExportUrl } from "@/lib/leads/csv";
import type { MappedLeadRow } from "@/lib/leads/csv";

const JOB_TITLE_HEADERS = ["job", "job title", "role", "position", "وظيفة", "الوظيفة", "وظيفه", "الوظيفه"];
const SALARY_HEADERS = ["salary", "expected salary", "راتب", "الراتب", "مرتب", "المرتب"];

function matches(header: string, candidates: string[]): boolean {
  const h = header.trim().toLowerCase();
  return candidates.some((c) => h === c || h.includes(c));
}

/** mapRowToLeadIdentity() already sorts every unrecognized column into
 *  `extra` — this pulls job title/expected salary back out into their own
 *  structured fields instead of leaving them as free-form extra data. */
function extractCandidateFields(mapped: MappedLeadRow): { jobTitle: string | null; expectedSalary: number | null; extra: Record<string, string> } {
  let jobTitle: string | null = null;
  let expectedSalary: number | null = null;
  const extra: Record<string, string> = {};

  for (const [header, value] of Object.entries(mapped.extra)) {
    if (!jobTitle && matches(header, JOB_TITLE_HEADERS)) { jobTitle = value; continue; }
    if (expectedSalary === null && matches(header, SALARY_HEADERS)) {
      const n = Number(value.replace(/[^\d.]/g, ""));
      if (!Number.isNaN(n) && n > 0) { expectedSalary = n; continue; }
    }
    extra[header] = value;
  }

  return { jobTitle, expectedSalary, extra };
}

// Same two-shape body as /api/admin/leads/import (excel: pre-parsed rows,
// sheet: server fetches the CSV export) — see that route's comment.
export async function POST(req: NextRequest) {
  const denied = await requirePermission("candidates", "create");
  if (denied) return denied;
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json() as { source?: "excel" | "sheet"; rows?: Record<string, string>[]; sheetUrl?: string };

  let records: Record<string, string>[];

  if (body.source === "sheet") {
    if (!body.sheetUrl) return NextResponse.json({ error: "sheetUrl required" }, { status: 400 });
    const csvUrl = toSheetCsvExportUrl(body.sheetUrl);
    if (!csvUrl) return NextResponse.json({ error: "not a recognizable Google Sheet link" }, { status: 400 });

    const res = await fetch(csvUrl);
    if (!res.ok) {
      return NextResponse.json(
        { error: "couldn't fetch the sheet — make sure it's shared as 'anyone with the link can view'" },
        { status: 400 }
      );
    }
    const text = await res.text();
    records = csvRowsToRecords(parseCsv(text));
  } else if (body.source === "excel") {
    if (!body.rows?.length) return NextResponse.json({ error: "rows required" }, { status: 400 });
    records = body.rows;
  } else {
    return NextResponse.json({ error: "source must be 'excel' or 'sheet'" }, { status: 400 });
  }

  if (records.length === 0) {
    return NextResponse.json({ error: "no rows found" }, { status: 400 });
  }

  const mapped = records.map((r) => {
    const base = mapRowToLeadIdentity(r);
    const { jobTitle, expectedSalary, extra } = extractCandidateFields(base);
    return { ...base, extra, jobTitle, expectedSalary };
  });
  const summary = await importCandidates(mapped, admin.id, body.source);
  return NextResponse.json({ summary });
}
