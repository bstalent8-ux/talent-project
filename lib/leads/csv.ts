// ─── Lightweight CSV parsing + column-name heuristics ───────────────────────
// No dependency — this repo avoids adding a parsing library for something a
// ~40-line function covers, and this needs to run on the edge (Google Sheet
// import fetches the CSV export server-side). Handles quoted fields with
// embedded commas/newlines, which a naive split(",") would corrupt.

/** Parses RFC4180-ish CSV text into rows of raw string cells. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') { inQuotes = true; continue; }
    if (c === ",") { row.push(field); field = ""; continue; }
    if (c === "\r") continue;
    if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; continue; }
    field += c;
  }
  // Final field/row (files without a trailing newline).
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/** Turns parsed CSV rows into header-keyed records, using row 0 as headers. */
export function csvRowsToRecords(rows: string[][]): Record<string, string>[] {
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const record: Record<string, string> = {};
    headers.forEach((h, i) => { record[h || `column_${i + 1}`] = (r[i] ?? "").trim(); });
    return record;
  });
}

// ─── Column-name heuristic mapping ──────────────────────────────────────────
// Sheets never arrive with the same headers twice. Recognized columns fill
// the fixed identity fields; anything unrecognized falls through to `extra`
// verbatim (by its original header) instead of being rejected — see
// CLAUDE.md-style "collect data as much as we can even if messy" from the
// leads-CRM discussion this feature implements.

const NAME_HEADERS   = ["name", "full name", "fullname", "اسم", "الاسم"];
const PHONE_HEADERS  = ["phone", "mobile", "number", "tel", "رقم", "الرقم", "موبايل", "تليفون", "التليفون"];
const EMAIL_HEADERS  = ["email", "e-mail", "mail", "ايميل", "الايميل", "إيميل", "الإيميل"];
const HANDLE_HEADERS = ["instagram", "handle", "account", "username", "social", "اكونت", "الاكونت", "انستجرام"];

function matches(header: string, candidates: string[]): boolean {
  const h = header.trim().toLowerCase();
  return candidates.some((c) => h === c || h.includes(c));
}

export interface MappedLeadRow {
  fullName:     string | null;
  phone:        string | null;
  email:        string | null;
  socialHandle: string | null;
  extra:        Record<string, string>;
}

/** Maps one raw CSV/Excel record to identity fields + an `extra` bag for
 *  every column that didn't match a known header. First match wins per
 *  category, so a sheet with two "name"-ish columns doesn't silently drop
 *  the second — it lands in `extra` instead. */
export function mapRowToLeadIdentity(row: Record<string, string>): MappedLeadRow {
  let fullName: string | null = null;
  let phone: string | null = null;
  let email: string | null = null;
  let socialHandle: string | null = null;
  const extra: Record<string, string> = {};

  for (const [header, rawValue] of Object.entries(row)) {
    const value = rawValue?.trim();
    if (!value) continue;

    if (!fullName && matches(header, NAME_HEADERS)) { fullName = value; continue; }
    if (!phone && matches(header, PHONE_HEADERS)) { phone = value; continue; }
    if (!email && matches(header, EMAIL_HEADERS)) { email = value; continue; }
    if (!socialHandle && matches(header, HANDLE_HEADERS)) { socialHandle = value; continue; }

    extra[header] = value;
  }

  return { fullName, phone, email, socialHandle, extra };
}

/** Public Google Sheets "share" links come in a few shapes; this normalizes
 *  any of them to the CSV export endpoint. Returns null if the link doesn't
 *  look like a Google Sheet at all — callers surface that as a real error
 *  instead of silently fetching garbage. */
export function toSheetCsvExportUrl(input: string): string | null {
  const m = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!m) return null;
  const id = m[1];
  const gidMatch = input.match(/[?#&]gid=(\d+)/);
  const gid = gidMatch ? gidMatch[1] : "0";
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}
