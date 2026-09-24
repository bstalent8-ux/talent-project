export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getCachedPublicTalentCards } from "@/features/talent-profile/services/public-talents.service";
import { publicCacheHeaders } from "@/lib/cache";

// GET /api/community/suggested-talents?limit=4 — a small, real slice of the
// public talent list for the community sidebar's "Suggested Talents" card.
// Reuses the same cached read Explore uses; no new table, no fake data.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 4) || 4, 12);

  const all = await getCachedPublicTalentCards();
  // Deterministic-ish shuffle by id so the widget doesn't always show the
  // same 4 people, without needing a random() DB call.
  const sorted = [...all].sort((a, b) => a.id.localeCompare(b.id));
  const offset = new Date().getDate() % Math.max(1, sorted.length);
  const rotated = [...sorted.slice(offset), ...sorted.slice(0, offset)];

  return NextResponse.json({ talents: rotated.slice(0, limit) }, { headers: publicCacheHeaders() });
}
