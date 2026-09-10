export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/require-admin";
import { requirePermission } from "@/lib/auth/permissions";
import { importCandidates } from "@/features/candidates/services/candidates.service";
import { csvRowsToRecords, mapRowToLeadIdentity, parseCsv, sheetCsvUrlCandidates } from "@/lib/leads/csv";
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
    const urls = sheetCsvUrlCandidates(body.sheetUrl);
    if (!urls) return NextResponse.json({ error: "not a recognizable Google Sheet link" }, { status: 400 });

    // Try gviz first, fall back to /export — see sheetCsvUrlCandidates's
    // comment. A network throw (edge-fetch failing a redirect) is caught the
    // same as a non-200 so the admin gets a real message, not a bare 500.
    let text: string | null = null;
    for (const url of urls) {
      try {
        const res = await fetch(url, { redirect: "follow" });
        if (res.ok) { text = await res.text(); break; }
      } catch {
        // try the next URL
      }
    }
    if (text === null) {
      return NextResponse.json(
        { error: "couldn't read the sheet — open it and set share access to 'Anyone with the link can view', then try again" },
        { status: 400 }
      );
    }
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

  // Stream progress as newline-delimited JSON so the admin UI shows a real
  // "X / total" bar. One import can be hundreds of rows, each its own
  // dedup-lookup + insert, so this genuinely takes seconds.
  //   {"type":"progress","processed":N,"total":T}
  //   {"type":"done","summary":{...}}
  //   {"type":"error","error":"..."}
  const encoder = new TextEncoder();
  const adminId = admin.id;
  const source = body.source;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      try {
        send({ type: "progress", processed: 0, total: mapped.length });
        const summary = await importCandidates(mapped, adminId, source, (processed, total) => {
          send({ type: "progress", processed, total });
        });
        send({ type: "done", summary });
      } catch {
        send({ type: "error", error: "import failed" });
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
