export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import {
  fetchPublicPackagesByAudience,
  fetchTalentTypes,
  normalizeTalentTypeId,
} from "@/features/packages/services/package.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = normalizeTalentTypeId(
      searchParams.get("categoryId")
      || searchParams.get("audience")
      || searchParams.get("talentType")
      || "ugc",
    );
    const audience = normalizeTalentTypeId(searchParams.get("audience") || categoryId);
    const talentType = normalizeTalentTypeId(searchParams.get("talentType") || categoryId || "ugc");
    const limit = Number(searchParams.get("limit") || "0") || undefined;

    const [talentTypes, packages] = await Promise.all([
      fetchTalentTypes(true),
      fetchPublicPackagesByAudience(categoryId, limit),
    ]);

    return NextResponse.json({ talentTypes, packages, talentType, audience, categoryId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load packages" },
      { status: 500 },
    );
  }
}
