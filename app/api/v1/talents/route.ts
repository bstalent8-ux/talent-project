export const runtime = 'edge';

import { NextResponse } from "next/server";
import { publicCacheHeaders } from "@/lib/cache";

export async function GET() {
  return NextResponse.json({ message: "Talents API v1" }, { headers: publicCacheHeaders() });
}
