export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/require-admin";
import { requirePermission } from "@/lib/auth/permissions";
import { importLeads } from "@/features/leads/services/leads.service";
import { csvRowsToRecords, mapRowToLeadIdentity, parseCsv, toSheetCsvExportUrl } from "@/lib/leads/csv";

// Two shapes of body:
//  - { source: "excel", rows: Record<string,string>[] } — the browser parsed
//    the .xlsx client-side (exceljs, already installed) and posts plain rows.
//  - { source: "sheet", sheetUrl: string } — the server fetches the public
//    CSV export of a Google Sheet link and parses it here.
// Both funnel into the same column-name heuristic + importLeads() dedupe.
export async function POST(req: NextRequest) {
  const denied = await requirePermission("leads", "create");
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

  const mapped = records.map(mapRowToLeadIdentity);
  const summary = await importLeads(mapped, admin.id, body.source);
  return NextResponse.json({ summary });
}
