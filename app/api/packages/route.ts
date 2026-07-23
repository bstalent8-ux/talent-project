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
    const audience = normalizeTalentTypeId(searchParams.get("audience") || searchParams.get("talentType") || "ugc");
    const talentType = normalizeTalentTypeId(searchParams.get("talentType") || audience || "ugc");
    const limit = Number(searchParams.get("limit") || "0") || undefined;

    const [talentTypes, packages] = await Promise.all([
      fetchTalentTypes(true),
      fetchPublicPackagesByAudience(audience, limit),
    ]);

    return NextResponse.json({ talentTypes, packages, talentType, audience });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load packages" },
      { status: 500 },
    );
  }
}
