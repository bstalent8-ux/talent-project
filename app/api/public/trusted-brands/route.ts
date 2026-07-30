export const runtime = "edge";

import { NextResponse } from "next/server";
import { CACHE_SECONDS, publicCacheHeaders } from "@/lib/cache";
import { getCachedPublicTrustedBrands } from "@/features/trusted-brands/trusted-brands.service";

export async function GET() {
  const brands = await getCachedPublicTrustedBrands();
  return NextResponse.json(brands, {
    headers: publicCacheHeaders(CACHE_SECONDS.oneHour),
  });
}
